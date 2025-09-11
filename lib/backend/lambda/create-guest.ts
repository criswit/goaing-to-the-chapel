import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, logger, getCurrentTimestamp, generateId } from './utils';
import { KeyBuilder } from '../dynamodb-schema';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || '';

interface CreateGuestRequest {
  eventId: string;
  guests: {
    name: string;
    email: string;
    phone?: string;
    plusOnesAllowed: number;
    groupName?: string;
    groupId?: string;
    isPrimaryContact?: boolean;
  }[];
}

interface CreateGuestResponse {
  success: boolean;
  message: string;
  created: number;
  failed: number;
  errors?: Array<{
    guest: string;
    error: string;
  }>;
}

/**
 * Lambda handler for creating/importing guest records
 * POST /api/guests/import
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  logger.info('Processing guest creation request', {
    requestId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required',
      });
    }

    const request: CreateGuestRequest = JSON.parse(event.body);

    // Validate request
    if (!request.eventId) {
      return createResponse(400, {
        success: false,
        error: 'Event ID is required',
      });
    }

    if (!request.guests || !Array.isArray(request.guests) || request.guests.length === 0) {
      return createResponse(400, {
        success: false,
        error: 'At least one guest is required',
      });
    }

    const timestamp = getCurrentTimestamp();
    let created = 0;
    let failed = 0;
    const errors: Array<{ guest: string; error: string }> = [];

    // Process each guest
    for (const guest of request.guests) {
      try {
        // Validate required fields
        if (!guest.name || !guest.email) {
          errors.push({
            guest: guest.name || guest.email || 'Unknown',
            error: 'Name and email are required',
          });
          failed++;
          continue;
        }

        // Check if guest already exists
        const existingGuest = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
              ':pk': KeyBuilder.buildEventPK(request.eventId),
              ':sk': KeyBuilder.buildGuestSK(guest.email),
            },
            Limit: 1,
          })
        );

        if (existingGuest.Items && existingGuest.Items.length > 0) {
          logger.info('Guest already exists, skipping', {
            email: guest.email,
            name: guest.name,
          });
          errors.push({
            guest: guest.name,
            error: 'Guest already exists with this email',
          });
          failed++;
          continue;
        }

        // Generate invitation code
        const invitationCode = generateInvitationCode();

        // Create guest record
        const guestItem = {
          PK: KeyBuilder.buildEventPK(request.eventId),
          SK: KeyBuilder.buildGuestSK(guest.email),
          EntityType: 'GUEST',
          guest_id: generateId(),
          guest_email: guest.email,
          guest_name: guest.name,
          guest_phone: guest.phone || null,
          event_id: request.eventId,
          event_name: 'Wedding Celebration', // Default, can be updated later
          event_date: '2025-06-14', // Default, can be updated later
          event_location: 'TBD', // Default, can be updated later
          invitation_code: invitationCode,
          invitation_sent: false,
          invitation_sent_date: null,
          rsvp_status: 'pending',
          max_plus_ones: guest.plusOnesAllowed || 0,
          plus_ones_count: 0,
          plus_ones_names: [],
          group_id: guest.groupId || null,
          group_name: guest.groupName || null,
          is_primary_contact: guest.isPrimaryContact || false,
          created_at: timestamp,
          updated_at: timestamp,
          // GSI attributes
          EventId: request.eventId,
          EventStatus: KeyBuilder.buildEventStatusGSI(request.eventId, 'pending'),
          AdminDate: KeyBuilder.buildAdminDateGSI(timestamp.split('T')[0], 'pending'),
        };

        // Store guest record
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: guestItem,
            ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
          })
        );

        logger.info('Guest created successfully', {
          requestId,
          guestEmail: guest.email,
          guestName: guest.name,
          invitationCode,
        });

        created++;
      } catch (error) {
        logger.error('Failed to create guest', {
          guest: guest.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errors.push({
          guest: guest.name,
          error: error instanceof Error ? error.message : 'Failed to create guest',
        });
        failed++;
      }
    }

    const response: CreateGuestResponse = {
      success: failed === 0,
      message: `Created ${created} guests, ${failed} failed`,
      created,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };

    return createResponse(failed === 0 ? 201 : 207, response);
  } catch (error) {
    logger.error('Error processing guest creation request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to process guest creation',
    });
  }
};

/**
 * Generate a unique invitation code
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
