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

const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';

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
      console.log('Fetching real guest data from DynamoDB');
      console.log('Using table:', TABLE_NAME);
      
      // Fetch all guest profiles (SK=PROFILE)
      const guestsResponse = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'SK = :sk',
          ExpressionAttributeValues: {
            ':sk': 'PROFILE',
          },
        })
      );

      const guests = guestsResponse.Items || [];

      // Fetch all RSVPs (SK=RSVP)
      const rsvpsResponse = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'SK = :sk',
          ExpressionAttributeValues: {
            ':sk': 'RSVP',
          },
        })
      );

      const rsvps = rsvpsResponse.Items || [];

      // Create a map of RSVPs by invitation code - keep only latest per guest
      const rsvpMap = new Map();
      rsvps.forEach((rsvp: Record<string, unknown>) => {
        // Extract invitation code from PK (format: GUEST#invitation-code)
        const pk = rsvp.PK as string;
        const invitationCode = pk ? pk.replace('GUEST#', '') : rsvp.invitation_code;
        
        const existing = rsvpMap.get(invitationCode);
        const rsvpTimestamp = new Date(
          (rsvp.responded_at || rsvp.submittedAt || rsvp.createdAt || 0) as string | number
        ).getTime();
        const existingTimestamp = existing
          ? new Date(existing.responded_at || existing.submittedAt || existing.createdAt || 0).getTime()
          : 0;

        if (!existing || rsvpTimestamp > existingTimestamp) {
          rsvpMap.set(invitationCode, rsvp);
        }
      });

      // Merge guest and RSVP data with improved name fallback
      const mergedGuests = guests.map((guest: Record<string, unknown>) => {
        const invitationCode = guest.invitation_code || guest.invitationCode;
        const rsvp = rsvpMap.get(invitationCode);

        // Guest name should come from guest_name or name field
        const guestName = guest.guest_name || guest.name || 'Unknown Guest';

        // Remove any existing rsvp-related fields to avoid conflicts
        const { 
          rsvpStatus: existingRsvpStatus, 
          rsvp_status: existingRsvpStatusUnderscore,
          name: existingName,
          guest_name: existingGuestName,
          ...guestClean 
        } = guest;

        if (rsvp) {
          // Extract plus-one names from plusOnes array
          const plusOnes = rsvp.plusOnes || [];
          const plusOneNames = plusOnes.map((po: any) => po.name || po).filter(Boolean);
          const plusOneName = plusOneNames.join(', ');
          
          // Use RSVP data when available
          return {
            ...guestClean,
            invitationCode,
            name: guestName,
            rsvpStatus: rsvp.rsvpStatus || rsvp.rsvp_status || 'pending',
            dietaryRestrictions: rsvp.dietary_restrictions || rsvp.dietaryRestrictions,
            plusOneName: plusOneName || rsvp.plusOneName,
            plusOneDietaryRestrictions: rsvp.plusOneDietaryRestrictions,
            submittedAt: rsvp.responded_at || rsvp.submittedAt || rsvp.createdAt,
            otherDietary: rsvp.otherDietary,
            plusOneOtherDietary: rsvp.plusOneOtherDietary,
            notes: rsvp.notes || rsvp.specialRequests,
            partySize: rsvp.attendeeCount || rsvp.guests || (1 + plusOnes.length),
          };
        }

        // NO RSVP = PENDING. Period. Don't use the guest's stored status.
        return {
          ...guestClean,
          invitationCode,
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
            TableName: TABLE_NAME,
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
            TableName: TABLE_NAME,
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
              TableName: TABLE_NAME,
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
