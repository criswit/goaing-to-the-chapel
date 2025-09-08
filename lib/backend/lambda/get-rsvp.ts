/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { withAuth, AuthenticatedEvent, RoleBasedAccess } from './auth-middleware';
import { createResponse, logger } from './utils';
import { KeyBuilder } from '../dynamodb-schema';
import { TransformUtils } from '../validation-schemas';
import {
  SecurityLogger,
  SecurityEventType,
  InputSanitizer,
  SecureErrorResponse,
} from './security-utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-dev';

interface GetRsvpResponse {
  success: boolean;
  guest?: {
    email: string;
    name: string;
    phone?: string;
    rsvpStatus: string;
    plusOnesCount: number;
    plusOnesNames?: string[];
    dietaryRestrictions?: string[];
    specialRequests?: string;
    groupId?: string;
    invitationCode: string;
  };
  event?: {
    eventId: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventType: string;
    location: {
      venueName: string;
      address: string;
      city: string;
      state: string;
    };
    dressCode?: string;
  };
  rsvpHistory?: Array<{
    responseDate: string;
    status: string;
    partySize: number;
    notes?: string;
  }>;
  error?: string;
}

/**
 * GET /api/rsvp/{invitationCode}
 * Retrieve guest information and current RSVP status
 *
 * This endpoint:
 * 1. Validates the invitation code from path parameters
 * 2. Retrieves guest data from DynamoDB
 * 3. Fetches event information
 * 4. Returns RSVP history if available
 */
const getRsvpHandler = async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  logger.info('Processing GET RSVP request', {
    requestId,
    path: event.path,
    userAuthenticated: event.auth?.isAuthenticated,
    userEmail: event.auth?.user?.guest_email,
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

    // Check if user has permission to access this invitation
    if (event.auth?.isAuthenticated && event.auth.user) {
      const userInviteCode = event.auth.user.invite_code;
      if (!RoleBasedAccess.isAdmin(event) && userInviteCode !== sanitizedCode) {
        logger.warn('User attempting to access different invitation', {
          requestId,
          userCode: userInviteCode,
          requestedCode: sanitizedCode,
        });

        await SecurityLogger.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, event, {
          requestedCode: sanitizedCode,
          userCode: userInviteCode,
        });

        return createResponse(403, {
          success: false,
          error: 'Access denied to this invitation',
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

    // Fetch event data
    const eventQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': KeyBuilder.buildEventPK(invitationData.event_id),
        ':sk': 'METADATA',
      },
    });

    const eventResult = await docClient.send(eventQuery);
    const eventData = eventResult.Items?.[0];

    // Fetch RSVP history (optional)
    const historyQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': KeyBuilder.buildEventPK(invitationData.event_id),
        ':skPrefix': `RSVP#${guestData.email}#`,
      },
      ScanIndexForward: false, // Most recent first
      Limit: 10,
    });

    const historyResult = await docClient.send(historyQuery);
    const rsvpHistory = (historyResult.Items || []).map((item: any) => ({
      responseDate: item.response_timestamp,
      status: item.response_status,
      partySize: item.party_size || 1,
      notes: item.special_accommodations,
    }));

    // Log successful data access
    await SecurityLogger.logSecurityEvent(SecurityEventType.DATA_ACCESS, event, {
      invitationCode: sanitizedCode,
      guestEmail: guestData.email,
      eventId: invitationData.event_id,
    });

    // Transform to camelCase for API response
    const response: GetRsvpResponse = {
      success: true,
      guest: {
        email: guestData.email,
        name: guestData.guest_name,
        phone: guestData.phone,
        rsvpStatus: guestData.rsvp_status || 'pending',
        plusOnesCount: guestData.plus_ones_count || 0,
        plusOnesNames: guestData.plus_ones_names,
        dietaryRestrictions: guestData.dietary_restrictions,
        specialRequests: guestData.special_requests,
        groupId: guestData.group_id,
        invitationCode: sanitizedCode,
      },
      event: eventData
        ? {
            eventId: invitationData.event_id,
            eventName: eventData.event_name,
            eventDate: eventData.event_date,
            eventTime: eventData.event_time,
            eventType: eventData.event_type,
            location: TransformUtils.toCamelCase(eventData.location),
            dressCode: eventData.dress_code,
          }
        : undefined,
      rsvpHistory: rsvpHistory.length > 0 ? rsvpHistory : undefined,
    };

    logger.info('RSVP data retrieved successfully', {
      requestId,
      invitationCode: sanitizedCode,
      guestEmail: guestData.email,
      hasHistory: rsvpHistory.length > 0,
    });

    return createResponse(200, response);
  } catch (error) {
    logger.error('Error retrieving RSVP data', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse = SecureErrorResponse.createErrorResponse(
      error,
      500,
      'Failed to retrieve RSVP information'
    );

    return createResponse(errorResponse.statusCode, {
      success: false,
      error: errorResponse.message,
      errorId: errorResponse.errorId,
    });
  }
};

// Export handler with authentication middleware
export const handler = withAuth(getRsvpHandler, {
  allowAnonymous: true, // Allow both authenticated and anonymous access
});
