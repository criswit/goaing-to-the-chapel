/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { withAuth, AuthenticatedEvent, getClientIp } from './auth-middleware';
import { createResponse, logger, generateId, getCurrentTimestamp } from './utils';
import { z } from 'zod';
import {
  DietaryRestrictionSchema,
  PlusOneDetailsSchema,
  formatValidationErrors,
} from './rsvp-validation';
import {
  SecurityLogger,
  SecurityEventType,
  BruteForceProtection,
  InputSanitizer,
  SecureErrorResponse,
  SuspiciousActivityDetector,
} from './security-utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-dev';

// Batch party RSVP request schema
const BatchPartyRsvpSchema = z.object({
  invitationCode: z
    .string()
    .min(1, 'Invitation code is required')
    .transform((val) => val.toLowerCase().trim()),

  partyId: z.string().optional(),

  primaryGuest: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2).max(100),
    phoneNumber: z.string().optional(),
    rsvpStatus: z.enum(['attending', 'not_attending', 'maybe']),
    dietaryRestrictions: z.array(DietaryRestrictionSchema).optional(),
    specialRequests: z.string().max(1000).optional(),
    needsTransportation: z.boolean().optional(),
    needsAccommodation: z.boolean().optional(),
  }),

  plusOnes: z.array(PlusOneDetailsSchema).optional(),

  songRequests: z.string().max(500).optional(),
  partyNotes: z.string().max(1000).optional(),
});

interface BatchPartyResponse {
  success: boolean;
  message?: string;
  partyId?: string;
  confirmationNumbers?: {
    primary: string;
    plusOnes: Record<string, string>;
  };
  errors?: Array<{
    guestId?: string;
    field?: string;
    message: string;
  }>;
}

/**
 * POST /api/rsvp/batch-party
 * Submit RSVP for an entire party (primary guest + plus ones)
 *
 * This endpoint:
 * 1. Validates the entire party submission
 * 2. Checks maximum plus-one limits
 * 3. Creates/updates RSVP responses for all party members
 * 4. Maintains party relationships in the database
 * 5. Returns confirmation numbers for each party member
 */
const batchPartyRsvpHandler = async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const clientIp = getClientIp(event);

  logger.info('Processing batch party RSVP request', {
    requestId,
    path: event.path,
    userAuthenticated: event.auth?.isAuthenticated,
    clientIp,
  });

  try {
    // Check for suspicious activity
    const suspiciousCheck = await SuspiciousActivityDetector.checkSuspiciousActivity(event);
    if (suspiciousCheck.suspicious) {
      logger.warn('Suspicious activity detected in batch party RSVP', {
        requestId,
        reasons: suspiciousCheck.reasons,
        clientIp,
      });

      return createResponse(400, {
        success: false,
        error: 'Invalid request detected',
      });
    }

    // Parse and sanitize request body
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required',
      });
    }

    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body);
      requestBody = InputSanitizer.sanitizeObject(requestBody);
    } catch {
      return createResponse(400, {
        success: false,
        error: 'Invalid JSON in request body',
      });
    }

    // Validate request body
    const validationResult = BatchPartyRsvpSchema.safeParse(requestBody);
    if (!validationResult.success) {
      logger.warn('Batch party RSVP validation failed', {
        requestId,
        errors: validationResult.error.issues,
      });

      return createResponse(400, {
        success: false,
        error: 'Validation failed',
        errors: formatValidationErrors(validationResult.error),
      } as BatchPartyResponse);
    }

    const validatedData = validationResult.data;

    // Check brute force protection
    const bruteForceKey = `batch:${validatedData.invitationCode}:${clientIp}`;
    if (BruteForceProtection.isLockedOut(bruteForceKey)) {
      logger.warn('Batch party RSVP blocked due to brute force protection', {
        requestId,
        invitationCode: validatedData.invitationCode,
        clientIp,
      });

      await SecurityLogger.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, event, {
        invitationCode: validatedData.invitationCode,
        type: 'batch_party',
      });

      return createResponse(429, {
        success: false,
        error: 'Too many attempts. Please try again later.',
      });
    }

    // Verify invitation code exists by querying guest profile
    const invitationQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `GUEST#${validatedData.invitationCode}`,
        ':sk': 'PROFILE',
      },
      Limit: 1,
    });

    const invitationResult = await docClient.send(invitationQuery);
    if (!invitationResult.Items || invitationResult.Items.length === 0) {
      BruteForceProtection.recordFailedAttempt(bruteForceKey, event);

      logger.warn('Invalid invitation code for batch party RSVP', {
        requestId,
        invitationCode: validatedData.invitationCode,
      });

      return createResponse(404, {
        success: false,
        error: 'Invalid invitation code',
      });
    }

    const invitationData = invitationResult.Items[0];
    BruteForceProtection.clearAttempts(bruteForceKey);

    // Validate plus-one limits
    const maxPlusOnes = invitationData.max_plus_ones || 5;
    const plusOnesCount = validatedData.plusOnes?.length || 0;

    if (plusOnesCount > maxPlusOnes) {
      return createResponse(400, {
        success: false,
        error: `Maximum ${maxPlusOnes} plus ones allowed for this invitation`,
      });
    }

    // Generate party ID if not provided
    const partyId = validatedData.partyId || `party_${generateId()}`;
    const timestamp = getCurrentTimestamp();
    const confirmationNumbers: Record<string, string> = {};

    // Prepare batch write items
    const batchWriteItems: any[] = [];

    // 1. Create/update primary guest RSVP
    const primaryRsvpId = generateId();
    const primaryConfirmation = `WED${primaryRsvpId.substring(0, 8).toUpperCase()}`;
    confirmationNumbers.primary = primaryConfirmation;

    const primaryRsvpItem = {
      PK: `GUEST#${validatedData.invitationCode}`,
      SK: 'RSVP',
      item_type: 'RSVP_RESPONSE',
      invitation_code: validatedData.invitationCode,
      rsvp_id: primaryRsvpId,
      confirmationNumber: primaryConfirmation,
      guest_email: validatedData.primaryGuest.email,
      guest_name: validatedData.primaryGuest.name,
      email: validatedData.primaryGuest.email,
      event_id: invitationData.event_id,
      party_id: partyId,
      is_primary_in_party: true,
      rsvpStatus: validatedData.primaryGuest.rsvpStatus,
      attendeeCount: 1 + plusOnesCount,
      dietaryRestrictions: validatedData.primaryGuest.dietaryRestrictions || [],
      dietaryNotes: validatedData.partyNotes || '',
      specialRequests: validatedData.primaryGuest.specialRequests || '',
      phoneNumber: validatedData.primaryGuest.phoneNumber || '',
      needsTransportation: validatedData.primaryGuest.needsTransportation || false,
      needsAccommodation: validatedData.primaryGuest.needsAccommodation || false,
      songRequests: validatedData.songRequests || '',
      plusOnes: validatedData.plusOnes || [],
      submittedAt: timestamp,
      updatedAt: timestamp,
      ip_address: clientIp,
      user_agent: event.headers['User-Agent'] || event.headers['user-agent'],
    };

    batchWriteItems.push({
      PutRequest: { Item: primaryRsvpItem },
    });

    // Plus-ones are stored in the main RSVP record, not as separate items

    // 3. Update primary guest profile record with RSVP status
    const updateGuestCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `GUEST#${validatedData.invitationCode}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `
        SET rsvpStatus = :status,
            lastRsvpUpdate = :timestamp,
            updatedAt = :timestamp
      `,
      ExpressionAttributeValues: {
        ':status': validatedData.primaryGuest.rsvpStatus,
        ':timestamp': timestamp,
      },
    });

    // Execute batch write for RSVP responses
    if (batchWriteItems.length > 0) {
      const batchWriteCommand = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batchWriteItems,
        },
      });

      await docClient.send(batchWriteCommand);
    }

    // Update guest record
    await docClient.send(updateGuestCommand);

    // Log successful submission
    await SecurityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, event, {
      action: 'batch_party_rsvp',
      partyId,
      primaryGuestEmail: validatedData.primaryGuest.email,
      eventId: invitationData.event_id,
      partySize: 1 + plusOnesCount,
      status: validatedData.primaryGuest.rsvpStatus,
    });

    logger.info('Batch party RSVP submitted successfully', {
      requestId,
      partyId,
      primaryGuestEmail: validatedData.primaryGuest.email,
      partySize: 1 + plusOnesCount,
      confirmationNumbers,
    });

    const response: BatchPartyResponse = {
      success: true,
      message: 'Party RSVP submitted successfully',
      partyId,
      confirmationNumbers: {
        primary: confirmationNumbers.primary,
        plusOnes: Object.fromEntries(
          Object.entries(confirmationNumbers).filter(([key]) => key !== 'primary')
        ),
      },
    };

    return createResponse(201, response);
  } catch (error) {
    logger.error('Error processing batch party RSVP', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse = SecureErrorResponse.createErrorResponse(
      error,
      500,
      'Failed to process party RSVP submission'
    );

    return createResponse(errorResponse.statusCode, {
      success: false,
      error: errorResponse.message,
      errorId: errorResponse.errorId,
    });
  }
};

// Export handler with authentication middleware
export const handler = withAuth(batchPartyRsvpHandler, {
  allowAnonymous: true, // Allow both authenticated and anonymous submissions
});
