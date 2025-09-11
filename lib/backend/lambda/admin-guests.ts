/* eslint-disable no-console */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || 'WeddingGuests';
const RSVPS_TABLE_NAME = process.env.RSVPS_TABLE_NAME || 'WeddingRSVPs';

interface Guest {
  invitationCode: string;
  name: string;
  email: string;
  phone?: string;
  partySize?: number;
  rsvpStatus?: 'pending' | 'attending' | 'not_attending' | 'maybe';
  dietaryRestrictions?: string[];
  plusOneName?: string;
  plusOneDietaryRestrictions?: string[];
  submittedAt?: string;
  otherDietary?: string;
  plusOneOtherDietary?: string;
  notes?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Admin guests request received:', event.httpMethod);

  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Fetch all guests with their RSVP status - filter for GUEST entities only
      const guestsResponse = await docClient.send(
        new ScanCommand({
          TableName: GUESTS_TABLE_NAME,
          FilterExpression: 'EntityType = :entityType',
          ExpressionAttributeValues: {
            ':entityType': 'GUEST',
          },
        })
      );

      const guests = guestsResponse.Items || [];

      // Fetch all RSVPs - filter for RSVP_RESPONSE entities only
      const rsvpsResponse = await docClient.send(
        new ScanCommand({
          TableName: RSVPS_TABLE_NAME,
          FilterExpression: 'EntityType = :entityType',
          ExpressionAttributeValues: {
            ':entityType': 'RSVP_RESPONSE',
          },
        })
      );

      const rsvps = rsvpsResponse.Items || [];

      // Create a map of RSVPs by invitation code - keep only latest per guest
      const rsvpMap = new Map();
      rsvps.forEach((rsvp: Record<string, unknown>) => {
        const existing = rsvpMap.get(rsvp.invitationCode);
        const rsvpTimestamp = new Date(
          (rsvp.submittedAt || rsvp.createdAt || 0) as string | number
        ).getTime();
        const existingTimestamp = existing
          ? new Date(existing.submittedAt || existing.createdAt || 0).getTime()
          : 0;

        if (!existing || rsvpTimestamp > existingTimestamp) {
          rsvpMap.set(rsvp.invitationCode, rsvp);
        }
      });

      // Merge guest and RSVP data with improved name fallback
      const mergedGuests = guests.map((guest: Record<string, unknown>) => {
        const rsvp = rsvpMap.get(guest.invitationCode);

        // Guest name should always come from the guest record in the GUESTS table
        // The RSVP table doesn't store the guest name
        const guestName = guest.name || guest.guestName || 'Unknown Guest';

        if (rsvp) {
          return {
            ...guest,
            name: guestName,
            rsvpStatus: rsvp.rsvp_status || 'pending',
            dietaryRestrictions: rsvp.dietaryRestrictions,
            plusOneName: rsvp.plusOneName,
            plusOneDietaryRestrictions: rsvp.plusOneDietaryRestrictions,
            submittedAt: rsvp.submittedAt || rsvp.createdAt,
            otherDietary: rsvp.otherDietary,
            plusOneOtherDietary: rsvp.plusOneOtherDietary,
            notes: rsvp.notes,
            partySize: 1 + (rsvp.plusOneName ? 1 : 0),
          };
        }

        return {
          ...guest,
          name: guestName,
          rsvpStatus: 'pending',
          partySize: 1,
        };
      });

      // Sort by name (handle missing names)
      mergedGuests.sort((a, b) => {
        const nameA = (a.name as string) || '';
        const nameB = (b.name as string) || '';
        return nameA.localeCompare(nameB);
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          guests: mergedGuests,
          total: mergedGuests.length,
        }),
      };
    }

    if (event.httpMethod === 'PUT') {
      // Update guest information
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing request body' }),
        };
      }

      const guestUpdate: Guest = JSON.parse(event.body);

      if (!guestUpdate.invitationCode) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invitation code is required' }),
        };
      }

      // Update guest in the guests table
      const updateExpression = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      if (guestUpdate.name) {
        updateExpression.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = guestUpdate.name;
      }

      if (guestUpdate.email) {
        updateExpression.push('email = :email');
        expressionAttributeValues[':email'] = guestUpdate.email;
      }

      if (guestUpdate.phone) {
        updateExpression.push('phone = :phone');
        expressionAttributeValues[':phone'] = guestUpdate.phone;
      }

      if (guestUpdate.notes) {
        updateExpression.push('notes = :notes');
        expressionAttributeValues[':notes'] = guestUpdate.notes;
      }

      // Add updated timestamp
      updateExpression.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      if (updateExpression.length > 0) {
        await docClient.send(
          new UpdateCommand({
            TableName: GUESTS_TABLE_NAME,
            Key: { invitationCode: guestUpdate.invitationCode },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames:
              Object.keys(expressionAttributeNames).length > 0
                ? expressionAttributeNames
                : undefined,
            ExpressionAttributeValues: expressionAttributeValues,
          })
        );
      }

      // If RSVP status is being updated, update the RSVP table
      if (guestUpdate.rsvpStatus && guestUpdate.rsvpStatus !== 'pending') {
        // Check if RSVP exists
        const existingRsvp = await docClient.send(
          new QueryCommand({
            TableName: RSVPS_TABLE_NAME,
            KeyConditionExpression: 'invitationCode = :code',
            ExpressionAttributeValues: {
              ':code': guestUpdate.invitationCode,
            },
          })
        );

        if (existingRsvp.Items && existingRsvp.Items.length > 0) {
          // Update existing RSVP
          await docClient.send(
            new UpdateCommand({
              TableName: RSVPS_TABLE_NAME,
              Key: { invitationCode: guestUpdate.invitationCode },
              UpdateExpression:
                'SET rsvp_status = :status, updatedAt = :updatedAt, adminModified = :adminModified',
              ExpressionAttributeValues: {
                ':status': guestUpdate.rsvpStatus,
                ':updatedAt': new Date().toISOString(),
                ':adminModified': true,
              },
            })
          );
        }
      }

      console.log(`Guest updated successfully: ${guestUpdate.invitationCode}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Guest updated successfully',
          invitationCode: guestUpdate.invitationCode,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in admin guests handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
