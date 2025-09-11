import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const invitationCode = body.invitationCode?.toLowerCase().trim();

    if (!invitationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, error: 'Invitation code is required' }),
      };
    }

    // Get guest record
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `GUEST#${invitationCode}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ valid: false, error: 'Invalid invitation code' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        guestInfo: {
          email: result.Item.email,
          name: result.Item.guest_name || result.Item.name || 'Guest',
          invitationCode: result.Item.invitation_code,
          maxGuests: result.Item.max_guests || 1,
        },
      }),
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, error: 'Internal server error' }),
    };
  }
};