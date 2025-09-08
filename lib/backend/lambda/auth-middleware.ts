import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { getPublicKey, JWTPayload } from './auth-token-generator';
import { createResponse, logger } from './utils';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  auth?: {
    isAuthenticated: boolean;
    user?: JWTPayload;
    error?: string;
  };
}

export type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

/**
 * Authentication middleware for protecting API endpoints
 *
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Validates token signature using public key
 * 3. Verifies token expiration and claims
 * 4. Enriches request context with user information
 * 5. Implements role-based access control
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options?: AuthMiddlewareOptions
): AuthenticatedHandler {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const authenticatedEvent = event as AuthenticatedEvent;

    try {
      // Extract token from Authorization header
      const token = extractToken(event);

      if (!token) {
        if (options?.allowAnonymous) {
          authenticatedEvent.auth = {
            isAuthenticated: false,
          };
          return handler(authenticatedEvent, context);
        }

        logger.warn('Missing authorization token', {
          path: event.path,
          method: event.httpMethod,
        });

        return createResponse(401, {
          error: 'Authorization token required',
        });
      }

      // Get public key for verification
      const publicKey = await getPublicKey();

      // Verify and decode token
      const decoded = await verifyToken(token, publicKey);

      if (!decoded) {
        logger.warn('Invalid token provided', {
          path: event.path,
          method: event.httpMethod,
        });

        return createResponse(401, {
          error: 'Invalid authorization token',
        });
      }

      // Check role-based access if required
      if (options?.requiredRole && decoded.role !== options.requiredRole) {
        logger.warn('Insufficient permissions', {
          path: event.path,
          method: event.httpMethod,
          userRole: decoded.role,
          requiredRole: options.requiredRole,
        });

        return createResponse(403, {
          error: 'Insufficient permissions',
        });
      }

      // Check event-specific access if required
      if (options?.eventId && decoded.event_id !== options.eventId) {
        logger.warn('Access denied to different event', {
          path: event.path,
          method: event.httpMethod,
          userEventId: decoded.event_id,
          requiredEventId: options.eventId,
        });

        return createResponse(403, {
          error: 'Access denied to this event',
        });
      }

      // Enrich request context with authenticated user
      authenticatedEvent.auth = {
        isAuthenticated: true,
        user: decoded,
      };

      // Log successful authentication
      logger.info('Request authenticated successfully', {
        path: event.path,
        method: event.httpMethod,
        userEmail: decoded.guest_email,
        userRole: decoded.role,
        tokenId: decoded.jti,
      });

      // Call the actual handler
      return handler(authenticatedEvent, context);
    } catch (error) {
      logger.error('Authentication middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof jwt.TokenExpiredError) {
        return createResponse(401, {
          error: 'Token has expired',
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return createResponse(401, {
          error: 'Invalid token',
        });
      }

      return createResponse(500, {
        error: 'Authentication error',
      });
    }
  };
}

/**
 * Options for authentication middleware
 */
export interface AuthMiddlewareOptions {
  /**
   * Allow anonymous access (auth is optional)
   */
  allowAnonymous?: boolean;

  /**
   * Required role for access
   */
  requiredRole?: 'GUEST' | 'ADMIN';

  /**
   * Specific event ID required for access
   */
  eventId?: string;

  /**
   * Custom token extractor function
   */
  tokenExtractor?: (event: APIGatewayProxyEvent) => string | null;
}

/**
 * Extract JWT token from request
 */
function extractToken(event: APIGatewayProxyEvent): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = event.headers['Authorization'] || event.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  // Check custom header (fallback)
  const customHeader = event.headers['X-Auth-Token'] || event.headers['x-auth-token'];
  if (customHeader) {
    return customHeader;
  }

  // Check query parameter (for download links, etc.)
  if (event.queryStringParameters?.token) {
    return event.queryStringParameters.token;
  }

  return null;
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string, publicKey: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `wedding-rsvp-${process.env.ENVIRONMENT || 'dev'}`,
      audience: 'wedding-guests',
    }) as JWTPayload;

    // Additional validation
    if (!decoded.guest_email || !decoded.event_id) {
      logger.warn('Token missing required claims', {
        tokenId: decoded.jti,
      });
      return null;
    }

    return decoded;
  } catch (error) {
    logger.error('Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Role-based access control helper
 */
export class RoleBasedAccess {
  /**
   * Check if user has admin role
   */
  static isAdmin(event: AuthenticatedEvent): boolean {
    return event.auth?.user?.role === 'ADMIN';
  }

  /**
   * Check if user has guest role
   */
  static isGuest(event: AuthenticatedEvent): boolean {
    return event.auth?.user?.role === 'GUEST';
  }

  /**
   * Check if user can access specific guest data
   */
  static canAccessGuestData(event: AuthenticatedEvent, guestEmail: string): boolean {
    if (!event.auth?.isAuthenticated || !event.auth.user) {
      return false;
    }

    // Admins can access all guest data
    if (this.isAdmin(event)) {
      return true;
    }

    // Guests can only access their own data
    return event.auth.user.guest_email === guestEmail;
  }

  /**
   * Check if user can modify guest data
   */
  static canModifyGuestData(event: AuthenticatedEvent, guestEmail: string): boolean {
    if (!event.auth?.isAuthenticated || !event.auth.user) {
      return false;
    }

    // Admins can modify all guest data
    if (this.isAdmin(event)) {
      return true;
    }

    // Guests can only modify their own data
    return event.auth.user.guest_email === guestEmail;
  }

  /**
   * Check if user can access event data
   */
  static canAccessEvent(event: AuthenticatedEvent, eventId: string): boolean {
    if (!event.auth?.isAuthenticated || !event.auth.user) {
      return false;
    }

    // Admins can access all events
    if (this.isAdmin(event)) {
      return true;
    }

    // Guests can only access their assigned event
    return event.auth.user.event_id === eventId;
  }
}

/**
 * Rate limiting middleware
 */
export class RateLimiter {
  private static attempts = new Map<string, number[]>();

  /**
   * Check if IP/user has exceeded rate limit
   */
  static isRateLimited(
    identifier: string,
    maxAttempts: number = 10,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      logger.warn('Rate limit exceeded', {
        identifier,
        attempts: recentAttempts.length,
        maxAttempts,
      });
      return true;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return false;
  }

  /**
   * Clear rate limit data for an identifier
   */
  static clearRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Get client IP address from event
 */
export function getClientIp(event: APIGatewayProxyEvent): string {
  // Check X-Forwarded-For header (common in API Gateway)
  const xForwardedFor = event.headers['X-Forwarded-For'] || event.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Check source IP from request context
  if (event.requestContext?.identity?.sourceIp) {
    return event.requestContext.identity.sourceIp;
  }

  return 'unknown';
}
