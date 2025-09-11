/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { withAuth, AuthenticatedEvent, RoleBasedAccess, getClientIp } from './auth-middleware';
import { createResponse, logger, generateId, getCurrentTimestamp } from './utils';
import { KeyBuilder } from '../dynamodb-schema';
import {
  validateCreateRsvpRequest,
  validateUpdateRsvpRequest,
  transformToDbFormat,
  formatValidationErrors,
  CreateRsvpRequestSchema,
} from './rsvp-validation';
import {
  SecurityLogger,
  SecurityEventType,
  BruteForceProtection,
  InputSanitizer,
  SecureErrorResponse,
  SuspiciousActivityDetector,
} from './security-utils';
import { z } from 'zod';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-dev';

interface CreateRsvpResponse {
  success: boolean;
  message?: string;
  rsvpId?: string;
  status?: string;
  submittedAt?: string;
  confirmationNumber?: string;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * POST /api/rsvp
 * Submit or update RSVP response
 *
 * This endpoint:
 * 1. Validates the request body using Zod schemas
 * 2. Verifies invitation code exists and is valid
 * 3. Checks if this is a new submission (201) or update (200)
 * 4. Stores RSVP response in DynamoDB
 * 5. Creates audit trail for the submission
 */
const createRsvpHandler = async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const clientIp = getClientIp(event);

  logger.info('Processing POST RSVP request', {
    requestId,
    path: event.path,
    userAuthenticated: event.auth?.isAuthenticated,
    userEmail: event.auth?.user?.guest_email,
    clientIp,
  });

  try {
    // Check for suspicious activity
    const suspiciousCheck = await SuspiciousActivityDetector.checkSuspiciousActivity(event);
    if (suspiciousCheck.suspicious) {
      logger.warn('Suspicious activity detected', {
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

    // Check if this is an update (has authentication) or new submission
    const isUpdate = event.auth?.isAuthenticated && event.auth.user;

    // Validate request body with appropriate schema
    const validationResult = isUpdate
      ? validateUpdateRsvpRequest(requestBody)
      : validateCreateRsvpRequest(requestBody);

    if (!validationResult.success) {
      logger.warn('RSVP validation failed', {
        requestId,
        errors: validationResult.error.issues,
      });

      return createResponse(400, {
        success: false,
        error: 'Validation failed',
        validationErrors: formatValidationErrors(validationResult.error),
      });
    }

    const validatedData = validationResult.data as z.infer<typeof CreateRsvpRequestSchema>;

    // Check brute force protection for invitation code
    const bruteForceKey = `rsvp:${validatedData.invitationCode}:${clientIp}`;
    if (BruteForceProtection.isLockedOut(bruteForceKey)) {
      logger.warn('RSVP submission blocked due to brute force protection', {
        requestId,
        invitationCode: validatedData.invitationCode,
        clientIp,
      });

      await SecurityLogger.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, event, {
        invitationCode: validatedData.invitationCode,
      });

      return createResponse(429, {
        success: false,
        error: 'Too many attempts. Please try again later.',
      });
    }

    // Verify invitation code exists and get guest data
    const invitationKey = KeyBuilder.buildInvitationGSI(validatedData.invitationCode);

    const invitationQuery = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'InvitationCodeIndex',
      KeyConditionExpression: 'InvitationCode = :code',
      ExpressionAttributeValues: {
        ':code': invitationKey,
      },
      Limit: 1,
    });

    const invitationResult = await docClient.send(invitationQuery);

    if (!invitationResult.Items || invitationResult.Items.length === 0) {
      // Record failed attempt
      BruteForceProtection.recordFailedAttempt(bruteForceKey, event);

      logger.warn('Invalid invitation code for RSVP submission', {
        requestId,
        invitationCode: validatedData.invitationCode,
      });

      return createResponse(404, {
        success: false,
        error: 'Invalid invitation code',
      });
    }

    const invitationData = invitationResult.Items[0];

    // Clear brute force attempts on successful code validation
    BruteForceProtection.clearAttempts(bruteForceKey);

    // Check if user has permission to update this RSVP
    if (event.auth?.isAuthenticated && event.auth.user) {
      const canModify = RoleBasedAccess.canModifyGuestData(event, invitationData.guest_email);
      if (!canModify) {
        logger.warn('User lacks permission to modify RSVP', {
          requestId,
          userEmail: event.auth.user.guest_email,
          targetEmail: invitationData.guest_email,
        });

        await SecurityLogger.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, event, {
          targetEmail: invitationData.guest_email,
          action: 'modify_rsvp',
        });

        return createResponse(403, {
          success: false,
          error: 'You do not have permission to modify this RSVP',
        });
      }
    }

    // Check if attendee count exceeds allowed plus ones
    const maxPlusOnes = invitationData.max_plus_ones || 5;
    if (validatedData.attendeeCount > maxPlusOnes + 1) {
      return createResponse(400, {
        success: false,
        error: `Maximum ${maxPlusOnes} plus ones allowed for this invitation`,
      });
    }

    // Validate plus-one count matches attendee count
    const plusOnesCount = validatedData.plusOnes?.length || 0;
    if (
      validatedData.rsvpStatus === 'attending' &&
      validatedData.attendeeCount !== plusOnesCount + 1
    ) {
      return createResponse(400, {
        success: false,
        error: 'Attendee count must match the number of plus-ones plus the primary guest',
      });
    }

    // Transform data to database format
    const dbData = transformToDbFormat(validatedData);
    const timestamp = getCurrentTimestamp();
    const rsvpId = generateId();
    const confirmationNumber = `WED${rsvpId.substring(0, 8).toUpperCase()}`;

    // Create RSVP response record
    const rsvpResponseItem = {
      PK: KeyBuilder.buildEventPK(invitationData.event_id),
      SK: KeyBuilder.buildRsvpSK(invitationData.guest_email, timestamp),
      EntityType: 'RSVP_RESPONSE',
      rsvp_id: rsvpId,
      confirmation_number: confirmationNumber,
      guest_email: invitationData.guest_email,
      guest_name: invitationData.guest_name, // Include guest name for email processing
      event_id: invitationData.event_id,
      event_name: invitationData.event_name,
      event_date: invitationData.event_date,
      event_location: invitationData.event_location,
      ...dbData,
      created_at: timestamp,
      updated_at: timestamp,
      ip_address: clientIp,
      user_agent: event.headers['User-Agent'] || event.headers['user-agent'],
      // GSI attributes
      EventId: invitationData.event_id,
      RSVPStatus: `${validatedData.rsvpStatus}#${timestamp}`,
    };

    // Store RSVP response
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: rsvpResponseItem,
      })
    );

    // Update guest record with latest RSVP status
    const updateGuestCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: KeyBuilder.buildEventPK(invitationData.event_id),
        SK: KeyBuilder.buildGuestSK(invitationData.guest_email),
      },
      UpdateExpression: `
        SET rsvp_status = :status,
            plus_ones_count = :count,
            plus_ones_names = :names,
            plus_ones = :plusOnesDetails,
            dietary_restrictions = :dietary,
            special_requests = :requests,
            last_rsvp_update = :timestamp,
            updated_at = :timestamp,
            EventStatus = :eventStatus,
            AdminDate = :adminDate
      `,
      ExpressionAttributeValues: {
        ':status': validatedData.rsvpStatus,
        ':count': validatedData.attendeeCount - 1, // Minus primary guest
        ':names': dbData.plus_ones_names || [],
        ':plusOnesDetails': dbData.plus_ones_details || [],
        ':dietary': dbData.dietary_restrictions || [],
        ':requests': dbData.special_requests || null,
        ':timestamp': timestamp,
        ':eventStatus': KeyBuilder.buildEventStatusGSI(
          invitationData.event_id,
          validatedData.rsvpStatus
        ),
        ':adminDate': KeyBuilder.buildAdminDateGSI(
          timestamp.split('T')[0],
          validatedData.rsvpStatus
        ),
      },
    });

    await docClient.send(updateGuestCommand);

    // Log successful submission
    await SecurityLogger.logSecurityEvent(SecurityEventType.DATA_MODIFICATION, event, {
      action: isUpdate ? 'update_rsvp' : 'create_rsvp',
      rsvpId,
      guestEmail: invitationData.guest_email,
      eventId: invitationData.event_id,
      status: validatedData.rsvpStatus,
      attendeeCount: validatedData.attendeeCount,
    });

    logger.info('RSVP submitted successfully', {
      requestId,
      rsvpId,
      confirmationNumber,
      guestEmail: invitationData.guest_email,
      status: validatedData.rsvpStatus,
      isUpdate,
    });

    const response: CreateRsvpResponse = {
      success: true,
      message: isUpdate ? 'Your RSVP has been updated successfully' : 'Thank you for your RSVP',
      rsvpId,
      status: validatedData.rsvpStatus,
      submittedAt: timestamp,
      confirmationNumber,
    };

    return createResponse(isUpdate ? 200 : 201, response);
  } catch (error) {
    logger.error('Error processing RSVP submission', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse = SecureErrorResponse.createErrorResponse(
      error,
      500,
      'Failed to process RSVP submission'
    );

    return createResponse(errorResponse.statusCode, {
      success: false,
      error: errorResponse.message,
      errorId: errorResponse.errorId,
    });
  }
};

// Export handler with authentication middleware
export const handler = withAuth(createRsvpHandler, {
  allowAnonymous: true, // Allow both authenticated and anonymous submissions
});
