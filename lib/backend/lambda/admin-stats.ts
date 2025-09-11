/* eslint-disable no-console */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || 'WeddingGuests';
const RSVPS_TABLE_NAME = process.env.RSVPS_TABLE_NAME || 'WeddingRSVPs';

interface RSVPStats {
  totalInvited: number;
  totalResponded: number;
  totalAttending: number;
  totalDeclined: number;
  totalPending: number;
  totalMaybe: number;
  totalGuests: number; // Including plus ones
  dietaryRestrictions: {
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    nutAllergy: number;
    other: number;
  };
  responseRate: number;
  averagePartySize: number;
  recentResponses: Array<{
    name: string;
    email: string;
    respondedAt: string;
    status: string;
    partySize: number;
  }>;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Admin stats request received');

  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
    // Scan guests table - filter for GUEST entities only
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

    // Scan RSVPs table - filter for RSVP_RESPONSE entities only
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

    // Deduplicate RSVPs - keep only the latest response per invitation code
    const latestRsvps = rsvps.reduce(
      (acc: Record<string, unknown>, rsvp: Record<string, unknown>) => {
        const invitationCode = rsvp.invitationCode as string;
        const existing = acc[invitationCode];
        const rsvpTimestamp = new Date(
          (rsvp.submittedAt || rsvp.createdAt || 0) as string | number
        ).getTime();
        const existingTimestamp = existing
          ? new Date(
              ((existing as Record<string, unknown>).submittedAt ||
                (existing as Record<string, unknown>).createdAt ||
                0) as string | number
            ).getTime()
          : 0;

        if (!existing || rsvpTimestamp > existingTimestamp) {
          acc[invitationCode] = rsvp;
        }
        return acc;
      },
      {}
    );

    const uniqueRsvps = Object.values(latestRsvps);

    // Calculate statistics
    const stats: RSVPStats = {
      totalInvited: guests.length,
      totalResponded: uniqueRsvps.length,
      totalAttending: 0,
      totalDeclined: 0,
      totalPending: guests.length - uniqueRsvps.length,
      totalMaybe: 0,
      totalGuests: 0,
      dietaryRestrictions: {
        vegetarian: 0,
        vegan: 0,
        glutenFree: 0,
        nutAllergy: 0,
        other: 0,
      },
      responseRate: 0,
      averagePartySize: 0,
      recentResponses: [],
    };

    // Process RSVPs
    const attendingParties: number[] = [];

    uniqueRsvps.forEach((rsvp: Record<string, unknown>) => {
      const rsvpStatus = rsvp.rsvp_status as string;
      if (rsvpStatus === 'attending') {
        stats.totalAttending++;
        const partySize = 1 + (rsvp.plusOneName ? 1 : 0);
        attendingParties.push(partySize);
        stats.totalGuests += partySize;

        // Count dietary restrictions
        const dietaryRestrictions = rsvp.dietaryRestrictions as string[] | undefined;
        if (dietaryRestrictions) {
          if (dietaryRestrictions.includes('vegetarian')) stats.dietaryRestrictions.vegetarian++;
          if (dietaryRestrictions.includes('vegan')) stats.dietaryRestrictions.vegan++;
          if (dietaryRestrictions.includes('gluten-free')) stats.dietaryRestrictions.glutenFree++;
          if (dietaryRestrictions.includes('nut-allergy')) stats.dietaryRestrictions.nutAllergy++;
          if (rsvp.otherDietary) stats.dietaryRestrictions.other++;
        }

        // Count plus one dietary restrictions
        const plusOneDietaryRestrictions = rsvp.plusOneDietaryRestrictions as string[] | undefined;
        if (plusOneDietaryRestrictions) {
          if (plusOneDietaryRestrictions.includes('vegetarian'))
            stats.dietaryRestrictions.vegetarian++;
          if (plusOneDietaryRestrictions.includes('vegan')) stats.dietaryRestrictions.vegan++;
          if (plusOneDietaryRestrictions.includes('gluten-free'))
            stats.dietaryRestrictions.glutenFree++;
          if (plusOneDietaryRestrictions.includes('nut-allergy'))
            stats.dietaryRestrictions.nutAllergy++;
          if (rsvp.plusOneOtherDietary) stats.dietaryRestrictions.other++;
        }
      } else if (rsvpStatus === 'not_attending') {
        stats.totalDeclined++;
      } else if (rsvpStatus === 'maybe') {
        stats.totalMaybe++;
      }
    });

    // Calculate rates
    if (stats.totalInvited > 0) {
      stats.responseRate = (stats.totalResponded / stats.totalInvited) * 100;
    }

    if (attendingParties.length > 0) {
      stats.averagePartySize =
        attendingParties.reduce((a, b) => a + b, 0) / attendingParties.length;
    }

    // Get recent responses (last 10)
    const sortedRsvps = uniqueRsvps
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const dateA = new Date((a.submittedAt || a.createdAt || 0) as string | number).getTime();
        const dateB = new Date((b.submittedAt || b.createdAt || 0) as string | number).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    stats.recentResponses = sortedRsvps.map((rsvp: Record<string, unknown>) => {
      const guest = guests.find(
        (g: Record<string, unknown>) => g.invitationCode === rsvp.invitationCode
      );
      return {
        name: (guest?.name || rsvp.name || 'Unknown') as string,
        email: (guest?.email || rsvp.email || '') as string,
        respondedAt: (rsvp.submittedAt || rsvp.createdAt) as string,
        status: (rsvp.rsvp_status || 'pending') as string,
        partySize: 1 + (rsvp.plusOneName ? 1 : 0),
      };
    });

    console.log('Stats calculated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch statistics' }),
    };
  }
};
