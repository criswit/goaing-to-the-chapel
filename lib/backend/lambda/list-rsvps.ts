/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { createResponse, createErrorResponse } from './utils';
import { DynamoDBItem } from './types';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    console.log('Processing list RSVPs request', { requestId, httpMethod: event.httpMethod });

    const guestId = event.queryStringParameters?.guestId;
    const eventId = event.queryStringParameters?.eventId;
    const status = event.queryStringParameters?.status;
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 50;
    const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey;

    // Query by guest ID (most efficient)
    if (guestId) {
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': { S: `GUEST#${guestId}` },
          ':skPrefix': { S: 'RSVP#' },
        },
        Limit: limit,
        ...(lastEvaluatedKey && {
          ExclusiveStartKey: JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString()),
        }),
      });

      const result = await dynamoClient.send(queryCommand);
      const rsvps = result.Items?.map((item) => unmarshall(item) as DynamoDBItem) || [];

      // Filter by eventId and status if provided
      let filteredRsvps = rsvps;
      if (eventId) {
        filteredRsvps = filteredRsvps.filter((rsvp) => rsvp.EventId === eventId);
      }
      if (status) {
        filteredRsvps = filteredRsvps.filter((rsvp) => rsvp.RSVPStatus === status);
      }

      console.log('RSVPs retrieved by guest', { guestId, count: filteredRsvps.length, requestId });

      return createResponse(200, {
        rsvps: filteredRsvps,
        count: filteredRsvps.length,
        ...(result.LastEvaluatedKey && {
          lastEvaluatedKey: Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64'),
        }),
      });
    }

    // Query by event ID and status using GSI
    if (eventId) {
      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'EventRSVPIndex',
        KeyConditionExpression: status
          ? 'EventId = :eventId AND RSVPStatus = :status'
          : 'EventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': { S: eventId },
          ...(status && { ':status': { S: status } }),
        },
        Limit: limit,
        ...(lastEvaluatedKey && {
          ExclusiveStartKey: JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString()),
        }),
      });

      const result = await dynamoClient.send(queryCommand);
      const rsvps = result.Items?.map((item) => unmarshall(item) as DynamoDBItem) || [];

      console.log('RSVPs retrieved by event', { eventId, status, count: rsvps.length, requestId });

      return createResponse(200, {
        rsvps: rsvps,
        count: rsvps.length,
        ...(result.LastEvaluatedKey && {
          lastEvaluatedKey: Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64'),
        }),
      });
    }

    // Query all RSVPs using GSI
    const queryCommand = new QueryCommand({
      TableName: tableName,
      IndexName: 'EntityTypeIndex',
      KeyConditionExpression: 'EntityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': { S: 'RSVP' },
      },
      Limit: limit,
      ...(lastEvaluatedKey && {
        ExclusiveStartKey: JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString()),
      }),
      ...(status && {
        FilterExpression: 'RSVPStatus = :status',
        ExpressionAttributeValues: {
          ':entityType': { S: 'RSVP' },
          ':status': { S: status },
        },
      }),
    });

    const result = await dynamoClient.send(queryCommand);
    const rsvps = result.Items?.map((item) => unmarshall(item) as DynamoDBItem) || [];

    console.log('All RSVPs retrieved', { status, count: rsvps.length, requestId });

    return createResponse(200, {
      rsvps: rsvps,
      count: rsvps.length,
      ...(result.LastEvaluatedKey && {
        lastEvaluatedKey: Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64'),
      }),
    });
  } catch (error: any) {
    console.error('Error listing RSVPs', { error: error.message, stack: error.stack, requestId });
    return createErrorResponse(
      500,
      'Internal Server Error',
      'An unexpected error occurred',
      requestId
    );
  }
};
