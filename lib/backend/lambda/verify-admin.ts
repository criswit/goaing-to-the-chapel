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
    const token = event.authorizationToken?.replace('Bearer ', '');

    if (!token) {
      console.log('No authorization token provided');
      throw new Error('Unauthorized');
    }

    // Get JWT public key
    const publicKey = await getJWTPublicKey();

    // Verify and decode token
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'wedding-rsvp-admin',
      audience: 'wedding-admin-dashboard',
    }) as TokenPayload;

    // Check if user has admin role
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      console.log(`User ${decoded.email} does not have admin role`);
      throw new Error('Unauthorized');
    }

    console.log(`Admin authorized: ${decoded.email} with role ${decoded.role}`);

    // Return authorization response
    return {
      principalId: decoded.email,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn.split('/').slice(0, -2).join('/') + '/*',
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
    console.error('Admin authorization error:', error);
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
    }) as TokenPayload;

    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
