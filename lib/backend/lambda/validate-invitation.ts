import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { KeyBuilder } from '../dynamodb-schema';
import { createResponse, logger } from './utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-dev';

interface InvitationValidationRequest {
  invitationCode: string;
}

interface InvitationValidationResponse {
  valid: boolean;
  guestInfo?: {
    email: string;
    name: string;
    eventId: string;
    groupId?: string;
    plusOnesAllowed: number;
    rsvpStatus: string;
  };
  error?: string;
}

/**
 * Lambda handler for validating invitation codes
 *
 * This function:
 * 1. Accepts an invitation code
 * 2. Queries DynamoDB using the InvitationCodeIndex GSI
 * 3. Validates the code is active and not expired
 * 4. Returns guest information for valid codes
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Invitation validation request received', {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers,
  });

  try {
    // Parse and validate request
    const body = JSON.parse(event.body || '{}') as InvitationValidationRequest;

    if (!body.invitationCode) {
      logger.warn('Missing invitation code in request');
      return createResponse(400, {
        valid: false,
        error: 'Invitation code is required',
      });
    }

    // Sanitize and format invitation code
    const formattedCode = body.invitationCode.toLowerCase().trim();

    if (!/^[a-z0-9\-]{3,50}$/.test(formattedCode)) {
      logger.warn('Invalid invitation code format', { code: formattedCode });
      return createResponse(400, {
        valid: false,
        error: 'Invalid invitation code format',
      });
    }

    // Query DynamoDB using InvitationCodeIndex
    const invitationKey = KeyBuilder.buildInvitationGSI(formattedCode);

    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'InvitationCodeIndex',
      KeyConditionExpression: 'InvitationCode = :code',
      ExpressionAttributeValues: {
        ':code': invitationKey,
      },
      Limit: 1,
    });

    logger.info('Querying DynamoDB for invitation code', {
      code: formattedCode,
      index: 'InvitationCodeIndex',
    });

    const result = await docClient.send(queryCommand);

    if (!result.Items || result.Items.length === 0) {
      logger.warn('Invitation code not found', { code: formattedCode });
      return createResponse(404, {
        valid: false,
        error: 'Invalid invitation code',
      });
    }

    const invitationData = result.Items[0];

    // Check if invitation is still valid
    const now = new Date();

    // Check if invitation has expired
    if (invitationData.valid_until) {
      const validUntil = new Date(invitationData.valid_until);
      if (now > validUntil) {
        logger.warn('Invitation code has expired', {
          code: formattedCode,
          expiredAt: invitationData.valid_until,
        });
        return createResponse(403, {
          valid: false,
          error: 'This invitation has expired',
        });
      }
    }

    // Check if invitation is active
    if (invitationData.is_active === false) {
      logger.warn('Invitation code is inactive', { code: formattedCode });
      return createResponse(403, {
        valid: false,
        error: 'This invitation is no longer active',
      });
    }

    // Check if invitation has reached max uses
    if (invitationData.max_uses && invitationData.current_uses >= invitationData.max_uses) {
      logger.warn('Invitation code has reached max uses', {
        code: formattedCode,
        currentUses: invitationData.current_uses,
        maxUses: invitationData.max_uses,
      });
      return createResponse(403, {
        valid: false,
        error: 'This invitation has already been used',
      });
    }

    // Now fetch the actual guest data using the primary key
    const guestQueryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': KeyBuilder.buildEventPK(invitationData.event_id),
        ':sk': KeyBuilder.buildGuestSK(invitationData.guest_email),
      },
    });

    const guestResult = await docClient.send(guestQueryCommand);

    if (!guestResult.Items || guestResult.Items.length === 0) {
      logger.error('Guest data not found for valid invitation', {
        code: formattedCode,
        email: invitationData.guest_email,
      });
      return createResponse(500, {
        valid: false,
        error: 'Guest data not found',
      });
    }

    const guestData = guestResult.Items[0];

    // Log successful validation for security auditing
    logger.info('Invitation code validated successfully', {
      code: formattedCode,
      guestEmail: guestData.email,
      eventId: guestData.event_id,
      timestamp: now.toISOString(),
    });

    // Return guest information
    const response: InvitationValidationResponse = {
      valid: true,
      guestInfo: {
        email: guestData.email,
        name: guestData.guest_name,
        eventId: invitationData.event_id,
        groupId: guestData.group_id,
        plusOnesAllowed: guestData.plus_ones_count || 0,
        rsvpStatus: guestData.rsvp_status || 'pending',
      },
    };

    return createResponse(200, response);
  } catch (error) {
    logger.error('Error validating invitation code', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createResponse(500, {
      valid: false,
      error: 'An error occurred while validating the invitation',
    });
  }
};

/**
 * Helper function to increment invitation usage count
 * Called after successful authentication
 */
export async function incrementInvitationUsage(invitationCode: string): Promise<void> {
  try {
    const formattedCode = invitationCode.toUpperCase().trim();
    const invitationKey = KeyBuilder.buildInvitationGSI(formattedCode);

    // First, get the current invitation data
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'InvitationCodeIndex',
      KeyConditionExpression: 'InvitationCode = :code',
      ExpressionAttributeValues: {
        ':code': invitationKey,
      },
      Limit: 1,
    });

    const result = await docClient.send(queryCommand);

    if (result.Items && result.Items.length > 0) {
      const invitation = result.Items[0];

      // Update the usage count
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: invitation.PK,
          SK: invitation.SK,
        },
        UpdateExpression: 'SET current_uses = current_uses + :inc, last_used_at = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':now': new Date().toISOString(),
        },
      });

      await docClient.send(updateCommand);

      logger.info('Invitation usage incremented', {
        code: formattedCode,
        newUsageCount: (invitation.current_uses || 0) + 1,
      });
    }
  } catch (error) {
    logger.error('Failed to increment invitation usage', {
      code: invitationCode,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - this is a non-critical operation
  }
}
