/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  createResponse,
  createErrorResponse,
  getCurrentTimestamp,
  validateRSVPStatus,
} from './utils';
import { DynamoDBItem } from './types';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    console.log('Processing update RSVP request', { requestId, httpMethod: event.httpMethod });

    const rsvpId = event.pathParameters?.rsvpId;
    const guestId = event.queryStringParameters?.guestId;
    const eventId = event.queryStringParameters?.eventId;

    if (!rsvpId) {
      return createErrorResponse(
        400,
        'Bad Request',
        'rsvpId path parameter is required',
        requestId
      );
    }

    if (!guestId || !eventId) {
      return createErrorResponse(
        400,
        'Bad Request',
        'guestId and eventId query parameters are required',
        requestId
      );
    }

    if (!event.body) {
      return createErrorResponse(400, 'Bad Request', 'Request body is required', requestId);
    }

    let updateData: any;
    try {
      updateData = JSON.parse(event.body);
    } catch (error) {
      console.error('Failed to parse request body', { error, requestId });
      return createErrorResponse(400, 'Bad Request', 'Invalid JSON in request body', requestId);
    }

    // Validate status if provided
    if (updateData.status && !validateRSVPStatus(updateData.status)) {
      return createErrorResponse(
        400,
        'Bad Request',
        'status must be one of: attending, not-attending, maybe',
        requestId
      );
    }

    // Validate attendeeCount if provided
    if (
      updateData.attendeeCount !== undefined &&
      (typeof updateData.attendeeCount !== 'number' || updateData.attendeeCount < 0)
    ) {
      return createErrorResponse(
        400,
        'Bad Request',
        'attendeeCount must be a non-negative number',
        requestId
      );
    }

    // First, check if the RSVP exists
    const getCommand = new GetItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `GUEST#${guestId}` },
        SK: { S: `RSVP#${eventId}#${rsvpId}` },
      },
    });

    const existingItem = await dynamoClient.send(getCommand);

    if (!existingItem.Item) {
      return createErrorResponse(404, 'Not Found', 'RSVP not found', requestId);
    }

    const timestamp = getCurrentTimestamp();

    // Build update expression dynamically
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {};

    // Always update the UpdatedAt timestamp
    updateExpressionParts.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
    expressionAttributeValues[':updatedAt'] = { S: timestamp };

    // Update allowed fields
    const allowedFields = [
      'status',
      'attendeeCount',
      'dietaryNotes',
      'specialRequests',
      'plusOneDetails',
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        const attributeName = `#${field}`;
        const valueName = `:${field}`;

        updateExpressionParts.push(`${attributeName} = ${valueName}`);
        expressionAttributeNames[attributeName] = field;
        expressionAttributeValues[valueName] = marshall({ [field]: updateData[field] })[field];

        // Update RSVPStatus for GSI if status is being updated
        if (field === 'status') {
          updateExpressionParts.push('#rsvpStatus = :rsvpStatus');
          expressionAttributeNames['#rsvpStatus'] = 'RSVPStatus';
          expressionAttributeValues[':rsvpStatus'] = { S: updateData[field] };
        }
      }
    }

    if (updateExpressionParts.length === 1) {
      return createErrorResponse(400, 'Bad Request', 'No valid fields to update', requestId);
    }

    const updateCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `GUEST#${guestId}` },
        SK: { S: `RSVP#${eventId}#${rsvpId}` },
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoClient.send(updateCommand);
    const updatedRsvp = unmarshall(result.Attributes!) as DynamoDBItem;

    console.log('RSVP updated successfully', { rsvpId, guestId, eventId, updateData, requestId });

    return createResponse(200, {
      message: 'RSVP updated successfully',
      rsvp: updatedRsvp,
    });
  } catch (error: any) {
    console.error('Error updating RSVP', { error: error.message, stack: error.stack, requestId });
    return createErrorResponse(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
      requestId
    );
  }
};
