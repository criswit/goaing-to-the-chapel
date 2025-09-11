import { SQSEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { logger, getCurrentTimestamp } from './utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';

interface ComplaintNotification {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintSubType?: string;
    complaintFeedbackType?: string;
    userAgent?: string;
    arrivalDate?: string;
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
 * Update guest email preferences based on complaint
 */
const updateGuestEmailPreferences = async (
  email: string,
  complaintType?: string,
  feedbackId?: string
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
      logger.warn('No guest found for complaint email', { email });
      return;
    }

    // Update each guest record to unsubscribe from emails
    for (const guest of queryResult.Items) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: guest.PK,
            SK: guest.SK,
          },
          UpdateExpression: `
            SET email_unsubscribed = :true,
                email_complaint_timestamp = :timestamp,
                email_complaint_type = :complaintType,
                email_complaint_feedback_id = :feedbackId,
                email_status = :status,
                updated_at = :timestamp
          `,
          ExpressionAttributeValues: {
            ':true': true,
            ':timestamp': timestamp,
            ':complaintType': complaintType || 'unknown',
            ':feedbackId': feedbackId || 'unknown',
            ':status': 'complained',
          },
        })
      );

      logger.info('Updated guest email preferences for complaint', {
        guestId: guest.SK,
        eventId: guest.PK,
        email,
        action: 'unsubscribed',
      });
    }

    // Log the complaint for monitoring
    logger.warn('Email complaint received - guest unsubscribed', {
      email,
      complaintType,
      feedbackId,
      timestamp,
    });
  } catch (error) {
    logger.error('Failed to update guest email preferences', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      complaintType,
    });
    throw error;
  }
};

/**
 * Lambda handler for processing SES complaint notifications
 */
export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;

  logger.info('Processing complaint notifications', {
    requestId,
    messageCount: event.Records.length,
  });

  for (const record of event.Records) {
    try {
      // Parse the SNS message from SQS
      const snsMessage = JSON.parse(record.body);
      const complaintNotification: ComplaintNotification = JSON.parse(
        snsMessage.Message || snsMessage
      );

      if (complaintNotification.notificationType !== 'Complaint') {
        logger.warn('Received non-complaint notification', {
          requestId,
          notificationType: complaintNotification.notificationType,
        });
        continue;
      }

      const { complaint } = complaintNotification;

      logger.info('Processing complaint', {
        requestId,
        complaintSubType: complaint.complaintSubType,
        complaintFeedbackType: complaint.complaintFeedbackType,
        feedbackId: complaint.feedbackId,
        recipientCount: complaint.complainedRecipients.length,
      });

      // Process each complained recipient
      for (const recipient of complaint.complainedRecipients) {
        try {
          await updateGuestEmailPreferences(
            recipient.emailAddress,
            complaint.complaintFeedbackType || complaint.complaintSubType,
            complaint.feedbackId
          );

          // Alert for critical complaints
          logger.error('Email complaint received', {
            requestId,
            email: recipient.emailAddress,
            complaintType: complaint.complaintFeedbackType || complaint.complaintSubType,
            feedbackId: complaint.feedbackId,
            userAgent: complaint.userAgent,
            messageSubject: complaintNotification.mail.commonHeaders?.subject,
          });
        } catch (error) {
          logger.error('Failed to process complained recipient', {
            requestId,
            email: recipient.emailAddress,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue processing other recipients
        }
      }

      logger.info('Complaint processed successfully', {
        requestId,
        feedbackId: complaint.feedbackId,
      });
    } catch (error) {
      logger.error('Failed to process complaint notification', {
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
