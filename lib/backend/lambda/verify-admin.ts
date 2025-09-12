/* eslint-disable no-console */

import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const JWT_PUBLIC_KEY_PARAM = process.env.JWT_PUBLIC_KEY_PARAM || '/wedding-rsvp/dev/jwt/public-key';

let jwtPublicKey: string | null = null;

async function getJWTPublicKey(): Promise<string> {
  if (jwtPublicKey) return jwtPublicKey;

  const command = new GetParameterCommand({
    Name: JWT_PUBLIC_KEY_PARAM,
    WithDecryption: false,
  });

  const response = await ssmClient.send(command);
  jwtPublicKey = response.Parameter?.Value || '';
  return jwtPublicKey;
}

interface TokenPayload {
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  name: string;
  iat?: number;
  exp?: number;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Admin authorization request received');

  try {
    const token = event.authorizationToken?.replace('Bearer ', '').trim();

    if (!token) {
      console.log('No authorization token provided');
      throw new Error('Unauthorized');
    }

    // Get JWT public key (cached for performance)
    const publicKey = await getJWTPublicKey();

    // Verify and decode token with proper error handling
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'wedding-rsvp-admin',
      audience: 'wedding-admin-dashboard',
      clockTolerance: 10, // Allow 10 seconds of clock skew
    }) as TokenPayload;

    // Check if user has admin role
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      console.log(`User ${decoded.email} does not have admin role`);
      throw new Error('Unauthorized');
    }

    console.log(`Admin authorized: ${decoded.email} with role ${decoded.role}`);

    // Return authorization response with wildcard resource to allow all methods and paths
    // This is necessary for path parameters like /admin/protected/guests/{invitationCode}
    const arnParts = event.methodArn.split(':');
    const apiGatewayArn = arnParts.slice(0, 5).join(':');
    const stage = event.methodArn.split('/')[1];
    const apiId = event.methodArn.split('/')[0].split(':').pop();

    // Create a wildcard resource ARN that allows all methods and paths
    const resource = `${apiGatewayArn}:${apiId}/${stage}/*/*`;

    console.log(`Generated policy resource: ${resource}`);

    return {
      principalId: decoded.email,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: resource,
          },
        ],
      },
      context: {
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    };
  } catch (error) {
    // Enhanced error logging for debugging
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired:', error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT validation error:', error.message);
    } else {
      console.error('Admin authorization error:', error);
    }
    throw new Error('Unauthorized');
  }
};

// Helper function to verify admin token for use in other Lambda functions
export async function verifyAdminToken(token: string): Promise<TokenPayload | null> {
  try {
    const publicKey = await getJWTPublicKey();

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'wedding-rsvp-admin',
      audience: 'wedding-admin-dashboard',
      clockTolerance: 10, // Allow 10 seconds of clock skew
    }) as TokenPayload;

    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded;
  } catch (error) {
    // Enhanced error logging for debugging
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token verification error - expired:', error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Token verification error - invalid:', error.message);
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}
