import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

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
        body: JSON.stringify({ success: false, error: 'Invitation code is required' }),
      };
    }

    // First validate the invitation exists
    const guestResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `GUEST#${invitationCode}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!guestResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid invitation code' }),
      };
    }

    const timestamp = new Date().toISOString();
    const confirmationNumber = `WED${Date.now().toString(36).toUpperCase()}`;

    // Create or update RSVP record
    const rsvpItem = {
      PK: `GUEST#${invitationCode}`,
      SK: 'RSVP',
      item_type: 'RSVP_RESPONSE',
      invitation_code: invitationCode,
      guest_name: guestResult.Item.guest_name || guestResult.Item.name,
      email: guestResult.Item.email,
      rsvpStatus: body.rsvpStatus || 'pending',
      attendeeCount: body.attendeeCount || 1,
      dietaryRestrictions: body.dietaryRestrictions || [],
      dietaryNotes: body.dietaryNotes || '',
      specialRequests: body.specialRequests || '',
      phoneNumber: body.phoneNumber || '',
      needsTransportation: body.needsTransportation || false,
      needsAccommodation: body.needsAccommodation || false,
      songRequests: body.songRequests || [],
      plusOnes: body.plusOnes || [],
      confirmationNumber,
      submittedAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: rsvpItem,
      })
    );

    // Update guest profile with RSVP status
    const updatedProfile = {
      ...guestResult.Item,
      rsvpStatus: body.rsvpStatus || 'pending',
      lastRsvpUpdate: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedProfile,
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for your RSVP',
        confirmationNumber,
        submittedAt: timestamp,
      }),
    };
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
};