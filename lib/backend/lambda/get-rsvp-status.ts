/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { withAuth, AuthenticatedEvent, RoleBasedAccess } from './auth-middleware';
import { createResponse, logger } from './utils';
import { KeyBuilder } from '../dynamodb-schema';
import { InputSanitizer, SecureErrorResponse } from './security-utils';
import { RsvpStatusResponseSchema } from './rsvp-validation';
import { z } from 'zod';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-dev';

type RsvpStatusResponse = z.infer<typeof RsvpStatusResponseSchema>;

/**
 * GET /api/rsvp/{invitationCode}/status
 * Check RSVP completion status and provide progress information
 *
 * This endpoint:
 * 1. Validates the invitation code
 * 2. Checks if guest has submitted RSVP
 * 3. Calculates completion percentage
 * 4. Identifies missing required fields
 * 5. Provides next steps for completion
 */
const getRsvpStatusHandler = async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  logger.info('Processing GET RSVP status request', {
    requestId,
    path: event.path,
    userAuthenticated: event.auth?.isAuthenticated,
  });

  try {
    // Extract and validate invitation code from path
    const invitationCode = event.pathParameters?.invitationCode;

    if (!invitationCode) {
      logger.warn('Missing invitation code in path', { requestId });
      return createResponse(400, {
        success: false,
        error: 'Invitation code is required',
      });
    }

    // Sanitize invitation code
    const sanitizedCode = InputSanitizer.sanitizeString(invitationCode.toUpperCase(), 8);

    if (!/^[A-Z0-9]{6,8}$/.test(sanitizedCode)) {
      logger.warn('Invalid invitation code format', {
        requestId,
        code: sanitizedCode,
      });
      return createResponse(400, {
        success: false,
        error: 'Invalid invitation code format',
      });
    }

    // Check if user has permission to access this status
    if (event.auth?.isAuthenticated && event.auth.user) {
      const userInviteCode = event.auth.user.invite_code;
      if (!RoleBasedAccess.isAdmin(event) && userInviteCode !== sanitizedCode) {
        logger.warn('User attempting to access different invitation status', {
          requestId,
          userCode: userInviteCode,
          requestedCode: sanitizedCode,
        });

        return createResponse(403, {
          success: false,
          error: 'Access denied to this invitation status',
        });
      }
    }

    // Query for invitation data
    const invitationKey = KeyBuilder.buildInvitationGSI(sanitizedCode);

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
      logger.warn('Invitation code not found', {
        requestId,
        code: sanitizedCode,
      });
      return createResponse(404, {
        success: false,
        error: 'Invitation not found',
      });
    }

    const invitationData = invitationResult.Items[0];

    // Fetch guest data
    const guestQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': KeyBuilder.buildEventPK(invitationData.event_id),
        ':sk': KeyBuilder.buildGuestSK(invitationData.guest_email),
      },
    });

    const guestResult = await docClient.send(guestQuery);

    if (!guestResult.Items || guestResult.Items.length === 0) {
      logger.error('Guest data not found for valid invitation', {
        requestId,
        code: sanitizedCode,
        email: invitationData.guest_email,
      });
      return createResponse(500, {
        success: false,
        error: 'Guest data not found',
      });
    }

    const guestData = guestResult.Items[0];

    // Fetch most recent RSVP response if exists
    const rsvpQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': KeyBuilder.buildEventPK(invitationData.event_id),
        ':skPrefix': `RSVP#${guestData.email}#`,
      },
      ScanIndexForward: false, // Most recent first
      Limit: 1,
    });

    const rsvpResult = await docClient.send(rsvpQuery);
    const latestRsvp = rsvpResult.Items?.[0];

    // Calculate completion status
    const rsvpStatus = guestData.rsvp_status || 'pending';
    const hasResponded = rsvpStatus !== 'pending';
    const isAttending = rsvpStatus === 'attending';

    // Track required fields for completion
    const missingFields: string[] = [];
    const requiredActions: string[] = [];

    // Basic response is required
    if (!hasResponded) {
      missingFields.push('rsvpStatus');
      requiredActions.push('Please indicate if you will be attending');
    }

    // If attending, check for additional required information
    if (isAttending) {
      if (!guestData.phone && !latestRsvp?.phone) {
        missingFields.push('phoneNumber');
        requiredActions.push('Please provide a contact phone number');
      }

      if (guestData.plus_ones_count > 0) {
        if (!guestData.plus_ones_names || guestData.plus_ones_names.length === 0) {
          missingFields.push('plusOnesNames');
          requiredActions.push('Please provide names of your plus ones');
        }
      }

      // Check for dietary restrictions if they selected "other"
      if (guestData.dietary_restrictions?.includes('other') && !guestData.dietary_notes) {
        missingFields.push('dietaryNotes');
        requiredActions.push('Please specify your dietary restrictions');
      }
    }

    // Calculate completion percentage
    let completionPercentage = 0;
    if (!hasResponded) {
      completionPercentage = 0;
    } else if (rsvpStatus === 'not_attending') {
      completionPercentage = 100; // Not attending requires no additional info
    } else if (rsvpStatus === 'maybe') {
      completionPercentage = 50; // Maybe status is partially complete
    } else if (isAttending) {
      // For attending, calculate based on required fields
      const totalRequiredFields =
        1 + // Basic RSVP
        (guestData.plus_ones_count > 0 ? 1 : 0) + // Plus ones names if applicable
        1; // Phone number
      const completedFields =
        1 + // They've responded
        (guestData.plus_ones_names?.length > 0 ? 1 : 0) +
        (guestData.phone || latestRsvp?.phone ? 1 : 0);

      completionPercentage = Math.round((completedFields / totalRequiredFields) * 100);
    }

    const isComplete = completionPercentage === 100;

    const response: RsvpStatusResponse = {
      success: true,
      status: {
        isComplete,
        completionPercentage,
        rsvpStatus: rsvpStatus as any,
        submittedAt: latestRsvp?.created_at,
        lastUpdatedAt: guestData.last_rsvp_update || guestData.updated_at,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        requiredActions: requiredActions.length > 0 ? requiredActions : undefined,
      },
    };

    logger.info('RSVP status retrieved successfully', {
      requestId,
      invitationCode: sanitizedCode,
      guestEmail: guestData.email,
      isComplete,
      completionPercentage,
      rsvpStatus,
    });

    return createResponse(200, response);
  } catch (error) {
    logger.error('Error retrieving RSVP status', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse = SecureErrorResponse.createErrorResponse(
      error,
      500,
      'Failed to retrieve RSVP status'
    );

    return createResponse(errorResponse.statusCode, {
      success: false,
      error: errorResponse.message,
      errorId: errorResponse.errorId,
    });
  }
};

// Export handler with authentication middleware
export const handler = withAuth(getRsvpStatusHandler, {
  allowAnonymous: true, // Allow both authenticated and anonymous access
});
