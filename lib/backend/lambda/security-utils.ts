/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';
import { logger } from './utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SECURITY_TABLE =
  process.env.SECURITY_TABLE_NAME || process.env.TABLE_NAME || 'wedding-rsvp-dev';

/**
 * Security event types for logging
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
}

/**
 * Security logger for audit trail
 */
export class SecurityLogger {
  /**
   * Log security event to DynamoDB
   */
  static async logSecurityEvent(
    eventType: SecurityEventType,
    event: APIGatewayProxyEvent,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const eventId = `SEC#${timestamp}#${crypto.randomBytes(8).toString('hex')}`;

      const securityLog = {
        PK: 'SECURITY_LOG',
        SK: eventId,
        EntityType: 'SECURITY_EVENT',
        eventType,
        timestamp,
        ipAddress: getClientIpSafe(event),
        userAgent: event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown',
        path: event.path,
        method: event.httpMethod,
        requestId: event.requestContext?.requestId,
        details,
        created_at: timestamp,
      };

      await docClient.send(
        new PutCommand({
          TableName: SECURITY_TABLE,
          Item: securityLog,
        })
      );

      // Also log to CloudWatch for real-time monitoring
      logger.info('Security event logged', {
        eventType,
        ipAddress: securityLog.ipAddress,
        path: event.path,
        details,
      });

      // Trigger alerts for critical events
      if (shouldTriggerAlert(eventType)) {
        await triggerSecurityAlert(eventType, securityLog);
      }
    } catch (error) {
      // Don't let logging failures affect the main flow
      logger.error('Failed to log security event', {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get recent security events for analysis
   */
  static async getRecentSecurityEvents(minutes: number = 60): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: SECURITY_TABLE,
          KeyConditionExpression: 'PK = :pk AND SK > :cutoff',
          ExpressionAttributeValues: {
            ':pk': 'SECURITY_LOG',
            ':cutoff': `SEC#${cutoffTime}`,
          },
          ScanIndexForward: false,
          Limit: 100,
        })
      );

      return result.Items || [];
    } catch (error) {
      logger.error('Failed to retrieve security events', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}

/**
 * Brute force protection
 */
export class BruteForceProtection {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  private static attempts = new Map<
    string,
    {
      count: number;
      firstAttempt: number;
      lockedUntil?: number;
    }
  >();

  /**
   * Check if an identifier is locked out
   */
  static isLockedOut(identifier: string): boolean {
    const record = this.attempts.get(identifier);

    if (!record) {
      return false;
    }

    // Check if lockout has expired
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }

    // Reset if lockout expired
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  /**
   * Record a failed attempt
   */
  static recordFailedAttempt(
    identifier: string,
    event?: APIGatewayProxyEvent
  ): { locked: boolean; remainingAttempts: number } {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (!record) {
      record = {
        count: 1,
        firstAttempt: now,
      };
      this.attempts.set(identifier, record);
    } else {
      // Reset if outside window
      if (now - record.firstAttempt > this.WINDOW_MS) {
        record.count = 1;
        record.firstAttempt = now;
        delete record.lockedUntil;
      } else {
        record.count++;
      }
    }

    // Check if should lock out
    if (record.count >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION_MS;

      if (event) {
        SecurityLogger.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, event, {
          identifier,
          attempts: record.count,
          lockedUntil: new Date(record.lockedUntil).toISOString(),
        });
      }

      return {
        locked: true,
        remainingAttempts: 0,
      };
    }

    return {
      locked: false,
      remainingAttempts: this.MAX_ATTEMPTS - record.count,
    };
  }

  /**
   * Clear attempts for an identifier (e.g., after successful login)
   */
  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return (
      input
        .substring(0, maxLength)
        .replace(/[<>]/g, '') // Remove potential HTML tags
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters
        .trim()
    );
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email.toLowerCase().trim().substring(0, 254);
  }

  /**
   * Validate and sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    return phone.replace(/[^\d+\-\s()]/g, '').substring(0, 20);
  }

  /**
   * Sanitize object by applying sanitization to all string fields
   */
  static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = this.sanitizePhone(value);
        } else {
          sanitized[key] = this.sanitizeString(value);
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Error response utilities for secure error messages
 */
export class SecureErrorResponse {
  /**
   * Create a secure error response that doesn't leak sensitive information
   */
  static createErrorResponse(
    error: any,
    statusCode: number = 500,
    userMessage?: string
  ): { statusCode: number; message: string; errorId: string } {
    const errorId = crypto.randomBytes(8).toString('hex');

    // Log the actual error internally
    logger.error('Application error', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      statusCode,
    });

    // Return generic message to user
    const safeMessages: Record<number, string> = {
      400: 'Invalid request',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      429: 'Too many requests',
      500: 'An error occurred processing your request',
    };

    return {
      statusCode,
      message: userMessage || safeMessages[statusCode] || 'An error occurred',
      errorId,
    };
  }
}

/**
 * Suspicious activity detection
 */
export class SuspiciousActivityDetector {
  /**
   * Check for suspicious patterns in request
   */
  static async checkSuspiciousActivity(
    event: APIGatewayProxyEvent
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Check for SQL injection patterns
    const sqlInjectionPattern =
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b|--|;|\||\\x[0-9a-f]{2})/i;
    const body = event.body || '';
    const queryString = JSON.stringify(event.queryStringParameters || {});

    if (sqlInjectionPattern.test(body) || sqlInjectionPattern.test(queryString)) {
      reasons.push('Potential SQL injection attempt');
    }

    // Check for XSS patterns
    const xssPattern = /<script|javascript:|on\w+\s*=/i;
    if (xssPattern.test(body) || xssPattern.test(queryString)) {
      reasons.push('Potential XSS attempt');
    }

    // Check for path traversal
    const pathTraversalPattern = /\.\.[/\\]/;
    if (pathTraversalPattern.test(event.path)) {
      reasons.push('Potential path traversal attempt');
    }

    // Check for abnormal request size
    if (body.length > 100000) {
      // 100KB limit
      reasons.push('Abnormally large request body');
    }

    // Check for missing or suspicious user agent
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'];
    if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
      reasons.push('Suspicious or missing user agent');
    }

    // Log if suspicious
    if (reasons.length > 0) {
      await SecurityLogger.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, event, {
        reasons,
      });
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}

/**
 * CORS security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

/**
 * Helper functions
 */
function getClientIpSafe(event: APIGatewayProxyEvent): string {
  try {
    const xForwardedFor = event.headers['X-Forwarded-For'] || event.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    if (event.requestContext?.identity?.sourceIp) {
      return event.requestContext.identity.sourceIp;
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function shouldTriggerAlert(eventType: SecurityEventType): boolean {
  const criticalEvents = [
    SecurityEventType.BRUTE_FORCE_ATTEMPT,
    SecurityEventType.SUSPICIOUS_ACTIVITY,
  ];

  return criticalEvents.includes(eventType);
}

async function triggerSecurityAlert(eventType: SecurityEventType, details: any): Promise<void> {
  // This would integrate with SNS or another alerting service
  logger.warn('SECURITY ALERT', {
    eventType,
    details,
    timestamp: new Date().toISOString(),
  });

  // TODO: Implement SNS notification
  // await snsClient.send(new PublishCommand({
  //   TopicArn: process.env.SECURITY_ALERT_TOPIC,
  //   Subject: `Security Alert: ${eventType}`,
  //   Message: JSON.stringify(details, null, 2),
  // }));
}

/**
 * Token blacklist for revoked tokens
 */
export class TokenBlacklist {
  private static blacklist = new Set<string>();

  /**
   * Add token to blacklist
   */
  static async revokeToken(jti: string): Promise<void> {
    this.blacklist.add(jti);

    // Store in DynamoDB for persistence
    try {
      await docClient.send(
        new PutCommand({
          TableName: SECURITY_TABLE,
          Item: {
            PK: 'TOKEN_BLACKLIST',
            SK: `TOKEN#${jti}`,
            jti,
            revokedAt: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days TTL
          },
        })
      );
    } catch (error) {
      logger.error('Failed to blacklist token', {
        jti,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isBlacklisted(jti: string): Promise<boolean> {
    // Check memory cache first
    if (this.blacklist.has(jti)) {
      return true;
    }

    // Check DynamoDB
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: SECURITY_TABLE,
          KeyConditionExpression: 'PK = :pk AND SK = :sk',
          ExpressionAttributeValues: {
            ':pk': 'TOKEN_BLACKLIST',
            ':sk': `TOKEN#${jti}`,
          },
          Limit: 1,
        })
      );

      if (result.Items && result.Items.length > 0) {
        this.blacklist.add(jti); // Add to memory cache
        return true;
      }
    } catch (error) {
      logger.error('Failed to check token blacklist', {
        jti,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return false;
  }
}
