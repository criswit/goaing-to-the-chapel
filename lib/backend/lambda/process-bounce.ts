import { SQSEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { logger, getCurrentTimestamp } from './utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';

interface BounceNotification {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    reportingMTA?: string;
  };
  mail: {
    timestamp: string;
    source: string;
    sourceArn: string;
    sendingAccountId: string;
    messageId: string;
    destination: string[];
    commonHeaders?: {
      subject?: string;
      from?: string[];
      to?: string[];
    };
  };
}

/**
 * Update guest email status based on bounce type
 */
const updateGuestEmailStatus = async (
  email: string,
  bounceType: string,
  bounceSubType: string,
  diagnosticCode?: string
): Promise<void> => {
  const timestamp = getCurrentTimestamp();

  try {
    // Find all guests with this email across all events
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex', // Assuming we have an email GSI
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      })
    );

    if (!queryResult.Items || queryResult.Items.length === 0) {
      logger.warn('No guest found for bounced email', { email });
      return;
    }

    // Update each guest record
    for (const guest of queryResult.Items) {
      const emailStatus = bounceType === 'Permanent' ? 'invalid' : 'bounced';

      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: guest.PK,
            SK: guest.SK,
          },
          UpdateExpression: `
            SET email_status = :status,
                email_bounce_type = :bounceType,
                email_bounce_subtype = :bounceSubType,
                email_bounce_timestamp = :timestamp,
                email_bounce_diagnostic = :diagnostic,
                updated_at = :timestamp
                ${bounceType === 'Permanent' ? ', email_invalid = :true' : ''}
          `,
          ExpressionAttributeValues: {
            ':status': emailStatus,
            ':bounceType': bounceType,
            ':bounceSubType': bounceSubType,
            ':timestamp': timestamp,
            ':diagnostic': diagnosticCode || 'No diagnostic code provided',
            ...(bounceType === 'Permanent' && { ':true': true }),
          },
        })
      );

      logger.info('Updated guest email status for bounce', {
        guestId: guest.SK,
        eventId: guest.PK,
        email,
        bounceType,
        emailStatus,
      });
    }
  } catch (error) {
    logger.error('Failed to update guest email status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      bounceType,
    });
    throw error;
  }
};

/**
 * Lambda handler for processing SES bounce notifications
 */
export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;

  logger.info('Processing bounce notifications', {
    requestId,
    messageCount: event.Records.length,
  });

  for (const record of event.Records) {
    try {
      // Parse the SNS message from SQS
      const snsMessage = JSON.parse(record.body);
      const bounceNotification: BounceNotification = JSON.parse(snsMessage.Message || snsMessage);

      if (bounceNotification.notificationType !== 'Bounce') {
        logger.warn('Received non-bounce notification', {
          requestId,
          notificationType: bounceNotification.notificationType,
        });
        continue;
      }

      const { bounce } = bounceNotification;

      logger.info('Processing bounce', {
        requestId,
        bounceType: bounce.bounceType,
        bounceSubType: bounce.bounceSubType,
        feedbackId: bounce.feedbackId,
        recipientCount: bounce.bouncedRecipients.length,
      });

      // Process each bounced recipient
      for (const recipient of bounce.bouncedRecipients) {
        try {
          await updateGuestEmailStatus(
            recipient.emailAddress,
            bounce.bounceType,
            bounce.bounceSubType,
            recipient.diagnosticCode
          );

          // Log critical bounces for manual review
          if (bounce.bounceType === 'Permanent') {
            logger.error('Permanent bounce detected', {
              requestId,
              email: recipient.emailAddress,
              bounceSubType: bounce.bounceSubType,
              diagnosticCode: recipient.diagnosticCode,
              action: recipient.action,
              status: recipient.status,
            });
          }
        } catch (error) {
          logger.error('Failed to process bounced recipient', {
            requestId,
            email: recipient.emailAddress,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue processing other recipients
        }
      }

      logger.info('Bounce processed successfully', {
        requestId,
        feedbackId: bounce.feedbackId,
      });
    } catch (error) {
      logger.error('Failed to process bounce notification', {
        requestId,
        messageId: record.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Throw to move message to DLQ after retries
      throw error;
    }
  }
};
