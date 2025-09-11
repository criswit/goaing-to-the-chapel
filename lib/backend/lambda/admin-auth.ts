/* eslint-disable no-console */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

const ADMIN_TABLE_NAME = process.env.ADMIN_TABLE_NAME || 'WeddingAdmins';
const JWT_PRIVATE_KEY_PARAM =
  process.env.JWT_PRIVATE_KEY_PARAM || '/wedding-rsvp/dev/jwt/private-key';

interface AdminCredentials {
  email: string;
  password: string;
}

interface AdminUser {
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  name: string;
  createdAt: string;
  lastLogin?: string;
}

let jwtPrivateKey: string | null = null;

async function getJWTPrivateKey(): Promise<string> {
  if (jwtPrivateKey) return jwtPrivateKey;

  const command = new GetParameterCommand({
    Name: JWT_PRIVATE_KEY_PARAM,
    WithDecryption: true,
  });

  const response = await ssmClient.send(command);
  jwtPrivateKey = response.Parameter?.Value || '';
  return jwtPrivateKey;
}

async function getAdminUser(email: string): Promise<AdminUser | null> {
  const command = new GetCommand({
    TableName: ADMIN_TABLE_NAME,
    Key: { email },
  });

  const response = await docClient.send(command);
  return response.Item as AdminUser | null;
}

async function updateLastLogin(email: string): Promise<void> {
  const updateCommand = new UpdateCommand({
    TableName: ADMIN_TABLE_NAME,
    Key: { email },
    UpdateExpression: 'SET lastLogin = :now',
    ExpressionAttributeValues: {
      ':now': new Date().toISOString(),
    },
  });

  await docClient.send(updateCommand);
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Admin authentication request received');

  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const { email, password }: AdminCredentials = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // Get admin user from DynamoDB
    const adminUser = await getAdminUser(email.toLowerCase());

    if (!adminUser) {
      console.log(`Admin user not found: ${email}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isPasswordValid) {
      console.log(`Invalid password for admin: ${email}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Get JWT private key
    const privateKey = await getJWTPrivateKey();

    // Generate JWT token
    const token = jwt.sign(
      {
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '8h', // Admin sessions last 8 hours
        issuer: 'wedding-rsvp-admin',
        audience: 'wedding-admin-dashboard',
      }
    );

    // Update last login timestamp
    await updateLastLogin(email.toLowerCase());

    console.log(`Admin authenticated successfully: ${email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      }),
    };
  } catch (error) {
    console.error('Admin authentication error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
