/* eslint-disable no-console */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  validateInvitationCode,
  validateAdminGuestUpdate,
  transformAdminUpdateToDbFormat,
  createAuditLogEntry,
  formatValidationErrors,
} from './admin-guest-validation';

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

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
  console.log('Admin guests request received:', event.httpMethod, event.path);
  console.log('Path parameters:', event.pathParameters);

  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
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
          ? new Date(
              existing.responded_at || existing.submittedAt || existing.createdAt || 0
            ).getTime()
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
        // We destructure these to exclude them from guestClean
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rsvpStatus, rsvp_status, name, guest_name, ...guestClean } = guest;

        if (rsvp) {
          // Extract plus-one names from plusOnes array
          const plusOnes = rsvp.plusOnes || [];
          const plusOneNames = plusOnes
            .map((po: unknown) => {
              if (typeof po === 'object' && po !== null && 'name' in po) {
                return (po as { name: string }).name;
              }
              return po;
            })
            .filter(Boolean);
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
            partySize: rsvp.attendeeCount || rsvp.guests || 1 + plusOnes.length,
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
      // Check if this is a path parameter update (single guest)
      const invitationCodeFromPath = event.pathParameters?.invitationCode;

      if (invitationCodeFromPath) {
        // Single guest update via path parameter
        return handleSingleGuestUpdate(invitationCodeFromPath, event, headers);
      }

      // Legacy bulk update support
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

    // Handle GET for single guest
    if (event.httpMethod === 'GET' && event.pathParameters?.invitationCode) {
      return handleGetSingleGuest(event.pathParameters.invitationCode, headers);
    }

    // Handle DELETE for single guest
    if (event.httpMethod === 'DELETE' && event.pathParameters?.invitationCode) {
      return handleDeleteGuest(event.pathParameters.invitationCode, event, headers);
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

// Handle single guest update with comprehensive validation and single-table design
async function handleSingleGuestUpdate(
  invitationCode: string,
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Validate invitation code format
    const codeValidation = validateInvitationCode(invitationCode);
    if (!codeValidation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid invitation code format',
          details: formatValidationErrors(codeValidation.error),
        }),
      };
    }

    const validatedCode = codeValidation.data;

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const updateData = JSON.parse(event.body);
    const validation = validateAdminGuestUpdate(updateData);

    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          details: formatValidationErrors(validation.error),
        }),
      };
    }

    const validatedData = validation.data;

    // Check if guest exists (PROFILE record)
    const profileKey = {
      PK: `GUEST#${validatedCode}`,
      SK: 'PROFILE',
    };

    const existingProfile = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: profileKey,
      })
    );

    if (!existingProfile.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Guest not found',
          invitationCode: validatedCode,
        }),
      };
    }

    // Transform update data to database format
    const { profileUpdate, rsvpUpdate, hasProfileChanges, hasRsvpChanges } =
      transformAdminUpdateToDbFormat(validatedData, validatedCode);

    // Prepare transaction items for atomic updates
    const transactItems = [];

    // Update PROFILE record if there are profile changes
    if (hasProfileChanges) {
      const profileUpdateExpression = [];
      const profileExpressionAttributeNames: Record<string, string> = {};
      const profileExpressionAttributeValues: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(profileUpdate)) {
        const attrName = `#${key.replace(/[^a-zA-Z0-9]/g, '')}`;
        const attrValue = `:${key.replace(/[^a-zA-Z0-9]/g, '')}`;
        profileUpdateExpression.push(`${attrName} = ${attrValue}`);
        profileExpressionAttributeNames[attrName] = key;
        profileExpressionAttributeValues[attrValue] = value;
      }

      // Add updated timestamp
      profileUpdateExpression.push('#updated_at = :updated_at');
      profileExpressionAttributeNames['#updated_at'] = 'updated_at';
      profileExpressionAttributeValues[':updated_at'] = new Date().toISOString();

      // Add admin modification flag
      profileUpdateExpression.push('#admin_modified = :admin_modified');
      profileExpressionAttributeNames['#admin_modified'] = 'admin_modified';
      profileExpressionAttributeValues[':admin_modified'] = true;

      transactItems.push({
        Update: {
          TableName: TABLE_NAME,
          Key: profileKey,
          UpdateExpression: `SET ${profileUpdateExpression.join(', ')}`,
          ExpressionAttributeNames: profileExpressionAttributeNames,
          ExpressionAttributeValues: profileExpressionAttributeValues,
          ConditionExpression: 'attribute_exists(PK)',
        },
      });
    }

    // Update or create RSVP record if there are RSVP changes
    if (hasRsvpChanges) {
      const rsvpKey = {
        PK: `GUEST#${validatedCode}`,
        SK: 'RSVP',
      };

      // Check if RSVP record exists
      const existingRsvp = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: rsvpKey,
        })
      );

      if (existingRsvp.Item) {
        // Update existing RSVP
        const rsvpUpdateExpression = [];
        const rsvpExpressionAttributeNames: Record<string, string> = {};
        const rsvpExpressionAttributeValues: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(rsvpUpdate)) {
          const attrName = `#${key.replace(/[^a-zA-Z0-9]/g, '')}`;
          const attrValue = `:${key.replace(/[^a-zA-Z0-9]/g, '')}`;
          rsvpUpdateExpression.push(`${attrName} = ${attrValue}`);
          rsvpExpressionAttributeNames[attrName] = key;
          rsvpExpressionAttributeValues[attrValue] = value;
        }

        // Add timestamps
        rsvpUpdateExpression.push('#updated_at = :updated_at');
        rsvpExpressionAttributeNames['#updated_at'] = 'updated_at';
        rsvpExpressionAttributeValues[':updated_at'] = new Date().toISOString();

        rsvpUpdateExpression.push('#admin_modified = :admin_modified');
        rsvpExpressionAttributeNames['#admin_modified'] = 'admin_modified';
        rsvpExpressionAttributeValues[':admin_modified'] = true;

        transactItems.push({
          Update: {
            TableName: TABLE_NAME,
            Key: rsvpKey,
            UpdateExpression: `SET ${rsvpUpdateExpression.join(', ')}`,
            ExpressionAttributeNames: rsvpExpressionAttributeNames,
            ExpressionAttributeValues: rsvpExpressionAttributeValues,
          },
        });
      } else if (validatedData.rsvpStatus && validatedData.rsvpStatus !== 'pending') {
        // Create new RSVP record if status is being set to non-pending
        const newRsvpItem = {
          PK: `GUEST#${validatedCode}`,
          SK: 'RSVP',
          invitation_code: validatedCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
          admin_created: true,
          admin_modified: true,
          ...rsvpUpdate,
        };

        transactItems.push({
          Put: {
            TableName: TABLE_NAME,
            Item: newRsvpItem,
          },
        });
      }
    }

    // Create audit log entry
    const adminUser = (event.requestContext?.authorizer as { email: string; name: string }) || {
      email: 'admin@wedding.dev',
      name: 'Admin',
    };
    const changes = [];

    for (const [key, value] of Object.entries({ ...profileUpdate, ...rsvpUpdate })) {
      changes.push({
        field: key,
        oldValue: existingProfile.Item[key],
        newValue: value,
      });
    }

    const auditEntry = createAuditLogEntry(adminUser, 'UPDATE', 'GUEST', validatedCode, changes, {
      sourceIp: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers['User-Agent'],
    });

    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: auditEntry,
      },
    });

    // Execute transaction
    if (transactItems.length > 0) {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: transactItems,
        })
      );
    }

    // Fetch updated guest data
    const updatedProfile = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: profileKey,
      })
    );

    const rsvpKey = {
      PK: `GUEST#${validatedCode}`,
      SK: 'RSVP',
    };

    const updatedRsvp = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: rsvpKey,
      })
    );

    // Merge profile and RSVP data for response
    const mergedGuest = {
      ...updatedProfile.Item,
      ...(updatedRsvp.Item || {}),
      invitationCode: validatedCode,
    };

    console.log(`Guest updated successfully via path parameter: ${validatedCode}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Guest updated successfully',
        guest: mergedGuest,
      }),
    };
  } catch (error) {
    console.error('Error updating guest:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Guest not found',
          invitationCode,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update guest',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

// Handle GET for single guest
async function handleGetSingleGuest(
  invitationCode: string,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Validate invitation code
    const codeValidation = validateInvitationCode(invitationCode);
    if (!codeValidation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid invitation code format',
          details: formatValidationErrors(codeValidation.error),
        }),
      };
    }

    const validatedCode = codeValidation.data;

    // Fetch profile
    const profileKey = {
      PK: `GUEST#${validatedCode}`,
      SK: 'PROFILE',
    };

    const profile = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: profileKey,
      })
    );

    if (!profile.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Guest not found',
          invitationCode: validatedCode,
        }),
      };
    }

    // Fetch RSVP
    const rsvpKey = {
      PK: `GUEST#${validatedCode}`,
      SK: 'RSVP',
    };

    const rsvp = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: rsvpKey,
      })
    );

    // Merge data
    const mergedGuest = {
      ...profile.Item,
      ...(rsvp.Item || {}),
      invitationCode: validatedCode,
      rsvpStatus: rsvp.Item?.rsvp_status || rsvp.Item?.rsvpStatus || 'pending',
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        guest: mergedGuest,
      }),
    };
  } catch (error) {
    console.error('Error fetching guest:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch guest',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

// Handle DELETE for single guest
async function handleDeleteGuest(
  invitationCode: string,
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Validate invitation code
    const codeValidation = validateInvitationCode(invitationCode);
    if (!codeValidation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid invitation code format',
          details: formatValidationErrors(codeValidation.error),
        }),
      };
    }

    const validatedCode = codeValidation.data;

    // Check if guest exists
    const profileKey = {
      PK: `GUEST#${validatedCode}`,
      SK: 'PROFILE',
    };

    const existingProfile = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: profileKey,
      })
    );

    if (!existingProfile.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Guest not found',
          invitationCode: validatedCode,
        }),
      };
    }

    // Create audit log entry
    const adminUser = (event.requestContext?.authorizer as { email: string; name: string }) || {
      email: 'admin@wedding.dev',
      name: 'Admin',
    };
    const auditEntry = createAuditLogEntry(adminUser, 'DELETE', 'GUEST', validatedCode, undefined, {
      sourceIp: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers['User-Agent'],
    });

    // Delete all records for this guest (PROFILE and RSVP)
    const transactItems = [
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: profileKey,
        },
      },
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `GUEST#${validatedCode}`,
            SK: 'RSVP',
          },
        },
      },
      {
        Put: {
          TableName: TABLE_NAME,
          Item: auditEntry,
        },
      },
    ];

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );

    console.log(`Guest deleted successfully: ${validatedCode}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Guest deleted successfully',
        invitationCode: validatedCode,
      }),
    };
  } catch (error) {
    console.error('Error deleting guest:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete guest',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
