/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as jwt from 'jsonwebtoken';
import { createResponse, logger } from './utils';
import { handler as validateInvitation, incrementInvitationUsage } from './validate-invitation';

const ssmClient = new SSMClient({});
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

// Cache for JWT keys to avoid repeated SSM calls
let cachedPrivateKey: string | null = null;
let cachedPublicKey: string | null = null;
let cacheExpiry: number = 0;

interface AuthTokenRequest {
  invitationCode: string;
}

interface AuthTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  guestInfo?: {
    email: string;
    name: string;
    eventId: string;
    role: string;
  };
  error?: string;
}

export interface JWTPayload {
  guest_email: string;
  event_id: string;
  invite_code: string;
  role: 'GUEST' | 'ADMIN';
  guest_name: string;
  group_id?: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
  jti: string; // JWT ID for tracking
}

/**
 * Lambda handler for JWT token generation
 *
 * This function:
 * 1. Validates the invitation code
 * 2. Retrieves RSA private key from Parameter Store
 * 3. Generates JWT token with RS256 algorithm
 * 4. Returns token with guest information
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Auth token generation request received', {
    path: event.path,
    method: event.httpMethod,
  });

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}') as AuthTokenRequest;

    if (!body.invitationCode) {
      return createResponse(400, {
        success: false,
        error: 'Invitation code is required',
      });
    }

    // First, validate the invitation code
    const validationEvent: APIGatewayProxyEvent = {
      ...event,
      body: JSON.stringify({ invitationCode: body.invitationCode }),
    };

    const validationResponse = await validateInvitation(validationEvent);
    const validationResult = JSON.parse(validationResponse.body);

    if (!validationResult.valid || !validationResult.guestInfo) {
      return createResponse(validationResponse.statusCode, {
        success: false,
        error: validationResult.error || 'Invalid invitation code',
      });
    }

    // Get JWT private key from Parameter Store
    const privateKey = await getPrivateKey();

    // Generate JWT token payload
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour in seconds

    const payload: JWTPayload = {
      guest_email: validationResult.guestInfo.email,
      event_id: validationResult.guestInfo.eventId,
      invite_code: body.invitationCode.toUpperCase().trim(),
      role: 'GUEST', // Default role, can be enhanced with admin detection
      guest_name: validationResult.guestInfo.name,
      group_id: validationResult.guestInfo.groupId,
      exp: now + expiresIn,
      iat: now,
      iss: `wedding-rsvp-${ENVIRONMENT}`,
      aud: 'wedding-guests',
      jti: generateJTI(), // Unique JWT ID
    };

    // Check if this is an admin user (you can customize this logic)
    if (isAdminEmail(validationResult.guestInfo.email)) {
      payload.role = 'ADMIN';
    }

    // Sign the JWT token with RS256 algorithm
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h',
      issuer: `wedding-rsvp-${ENVIRONMENT}`,
      audience: 'wedding-guests',
    });

    // Generate refresh token (optional, simpler token for refresh)
    const refreshToken = jwt.sign(
      {
        guest_email: payload.guest_email,
        event_id: payload.event_id,
        type: 'refresh',
        jti: generateJTI(),
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d', // Refresh token valid for 7 days
        issuer: `wedding-rsvp-${ENVIRONMENT}`,
        audience: 'wedding-guests-refresh',
      }
    );

    // Increment invitation usage count
    await incrementInvitationUsage(body.invitationCode);

    // Log successful authentication for security auditing
    logger.info('JWT token generated successfully', {
      guestEmail: payload.guest_email,
      eventId: payload.event_id,
      role: payload.role,
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });

    const response: AuthTokenResponse = {
      success: true,
      token,
      refreshToken,
      expiresIn,
      guestInfo: {
        email: payload.guest_email,
        name: payload.guest_name,
        eventId: payload.event_id,
        role: payload.role,
      },
    };

    return createResponse(200, response);
  } catch (error) {
    logger.error('Error generating auth token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createResponse(500, {
      success: false,
      error: 'Failed to generate authentication token',
    });
  }
};

/**
 * Get RSA private key from Parameter Store with caching
 */
async function getPrivateKey(): Promise<string> {
  const now = Date.now();

  // Check if cache is still valid (5 minutes)
  if (cachedPrivateKey && cacheExpiry > now) {
    return cachedPrivateKey;
  }

  try {
    const command = new GetParameterCommand({
      Name: `/wedding-rsvp/${ENVIRONMENT}/jwt/private-key`,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);

    if (!response.Parameter?.Value) {
      throw new Error('Private key not found in Parameter Store');
    }

    cachedPrivateKey = response.Parameter.Value;
    cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes

    return cachedPrivateKey!; // We know it's not null at this point
  } catch (error) {
    logger.error('Failed to retrieve private key from Parameter Store', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to retrieve signing key');
  }
}

/**
 * Get RSA public key from Parameter Store with caching
 */
export async function getPublicKey(): Promise<string> {
  const now = Date.now();

  // Check if cache is still valid (5 minutes)
  if (cachedPublicKey && cacheExpiry > now) {
    return cachedPublicKey;
  }

  try {
    const command = new GetParameterCommand({
      Name: `/wedding-rsvp/${ENVIRONMENT}/jwt/public-key`,
      WithDecryption: false, // Public key doesn't need decryption
    });

    const response = await ssmClient.send(command);

    if (!response.Parameter?.Value) {
      throw new Error('Public key not found in Parameter Store');
    }

    cachedPublicKey = response.Parameter.Value;
    cacheExpiry = now + 5 * 60 * 1000; // Cache for 5 minutes

    return cachedPublicKey!; // We know it's not null at this point
  } catch (error) {
    logger.error('Failed to retrieve public key from Parameter Store', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to retrieve verification key');
  }
}

/**
 * Generate unique JWT ID
 */
function generateJTI(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if email belongs to an admin user
 */
function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Refresh token handler
 * Generates a new access token from a valid refresh token
 */
export async function refreshTokenHandler(refreshToken: string): Promise<AuthTokenResponse> {
  try {
    const publicKey = await getPublicKey();

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, publicKey, {
      algorithms: ['RS256'],
      issuer: `wedding-rsvp-${ENVIRONMENT}`,
      audience: 'wedding-guests-refresh',
    }) as any;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Generate new access token
    const privateKey = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600;

    const newPayload: Partial<JWTPayload> = {
      guest_email: decoded.guest_email,
      event_id: decoded.event_id,
      exp: now + expiresIn,
      iat: now,
      jti: generateJTI(),
    };

    const newToken = jwt.sign(newPayload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h',
      issuer: `wedding-rsvp-${ENVIRONMENT}`,
      audience: 'wedding-guests',
    });

    return {
      success: true,
      token: newToken,
      expiresIn,
    };
  } catch (error) {
    logger.error('Failed to refresh token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Invalid or expired refresh token',
    };
  }
}
