/* eslint-disable no-console */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';

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
  console.log('TABLE_NAME environment variable:', process.env.TABLE_NAME);
  console.log('Using table name:', TABLE_NAME);

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
    console.log('Fetching real statistics from DynamoDB');
    console.log('Using table:', TABLE_NAME);

    // Scan for PROFILE records (guests)
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
    console.log(`Found ${guests.length} guests in database`);

    // Scan for RSVP records
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
    console.log(`Found ${rsvps.length} RSVP records in database`);

    // Deduplicate RSVPs - keep only the latest response per invitation code
    const latestRsvps = rsvps.reduce(
      (acc: Record<string, unknown>, rsvp: Record<string, unknown>) => {
        // Extract invitation code from PK (format: GUEST#invitation-code)
        const pk = rsvp.PK as string;
        const invitationCode = pk ? pk.replace('GUEST#', '') : (rsvp.invitation_code as string);
        const existing = acc[invitationCode];
        const rsvpTimestamp = new Date(
          (rsvp.responded_at || rsvp.submittedAt || rsvp.createdAt || 0) as string | number
        ).getTime();
        const existingTimestamp = existing
          ? new Date(
              ((existing as Record<string, unknown>).responded_at ||
                (existing as Record<string, unknown>).submittedAt ||
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
      const rsvpStatus = (rsvp.rsvpStatus || rsvp.rsvp_status) as string;
      if (rsvpStatus === 'attending') {
        stats.totalAttending++;
        const partySize = (rsvp.guests as number) || 1;
        attendingParties.push(partySize);
        stats.totalGuests += partySize;

        // Count dietary restrictions from the dietary_restrictions field
        const dietaryRestrictionsStr = (rsvp.dietary_restrictions || '') as string;
        if (dietaryRestrictionsStr) {
          const dietaryRestrictions = dietaryRestrictionsStr
            .toLowerCase()
            .split(',')
            .map((d) => d.trim());
          if (dietaryRestrictions.includes('vegetarian')) stats.dietaryRestrictions.vegetarian++;
          if (dietaryRestrictions.includes('vegan')) stats.dietaryRestrictions.vegan++;
          if (
            dietaryRestrictions.includes('gluten-free') ||
            dietaryRestrictions.includes('gluten free')
          )
            stats.dietaryRestrictions.glutenFree++;
          if (
            dietaryRestrictions.includes('nut-allergy') ||
            dietaryRestrictions.includes('nut allergy')
          )
            stats.dietaryRestrictions.nutAllergy++;
          if (
            dietaryRestrictions.some(
              (d) =>
                d &&
                ![
                  'vegetarian',
                  'vegan',
                  'gluten-free',
                  'gluten free',
                  'nut-allergy',
                  'nut allergy',
                ].includes(d)
            )
          ) {
            stats.dietaryRestrictions.other++;
          }
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
        const dateA = new Date(
          (a.responded_at || a.submittedAt || a.createdAt || 0) as string | number
        ).getTime();
        const dateB = new Date(
          (b.responded_at || b.submittedAt || b.createdAt || 0) as string | number
        ).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    stats.recentResponses = sortedRsvps.map((rsvp: Record<string, unknown>) => {
      // Extract invitation code from PK
      const pk = rsvp.PK as string;
      const invitationCode = pk ? pk.replace('GUEST#', '') : (rsvp.invitation_code as string);

      const guest = guests.find((g: Record<string, unknown>) => {
        const guestPK = g.PK as string;
        const guestCode = guestPK ? guestPK.replace('GUEST#', '') : (g.invitation_code as string);
        return guestCode === invitationCode;
      });
      return {
        name: (guest?.guest_name || 'Unknown Guest') as string,
        email: (guest?.email || '') as string,
        respondedAt: (rsvp.responded_at || rsvp.created_at) as string,
        status: (rsvp.rsvpStatus || 'pending') as string,
        partySize: (rsvp.guests as number) || 1,
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
