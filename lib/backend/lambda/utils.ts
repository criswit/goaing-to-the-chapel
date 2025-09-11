/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { APIResponse } from './types';
import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Logger utility for structured logging
 */
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      JSON.stringify({
        level: 'INFO',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },

  warn: (message: string, meta?: any) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },

  error: (message: string, meta?: any) => {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },

  debug: (message: string, meta?: any) => {
    if (process.env.DEBUG === 'true') {
      console.debug(
        JSON.stringify({
          level: 'DEBUG',
          message,
          ...meta,
          timestamp: new Date().toISOString(),
        })
      );
    }
  },
};

export const createResponse = (statusCode: number, body: any): APIResponse => {
  // Get allowed origin from environment or default to permissive for dev
  const allowedOrigin = process.env.CORS_ORIGIN || '*';

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Auth-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  };
};

export const createErrorResponse = (
  statusCode: number,
  error: string,
  message: string,
  requestId?: string
): APIResponse => {
  const errorBody = {
    error,
    message,
    ...(requestId && { requestId }),
  };

  return createResponse(statusCode, errorBody);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRSVPStatus = (status: string): boolean => {
  return ['attending', 'not-attending', 'maybe'].includes(status);
};

/**
 * Validate request body and headers
 */
export const validateRequest = (
  event: APIGatewayProxyEvent
): {
  valid: boolean;
  error?: string;
} => {
  // Check for body
  if (!event.body) {
    return { valid: false, error: 'Request body is required' };
  }

  // Try to parse JSON
  try {
    JSON.parse(event.body);
  } catch {
    return { valid: false, error: 'Invalid JSON in request body' };
  }

  // Check content type
  const contentType = event.headers['Content-Type'] || event.headers['content-type'];
  if (contentType && !contentType.includes('application/json')) {
    return { valid: false, error: 'Content-Type must be application/json' };
  }

  return { valid: true };
};
