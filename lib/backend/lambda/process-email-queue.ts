import { SQSEvent, Context } from 'aws-lambda';
import { SESClient } from '@aws-sdk/client-ses';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from './utils';
import { getEmailTemplate, TemplateData } from '../email-templates/templates';

const sesClient = new SESClient({});
const sqsClient = new SQSClient({});

const SOURCE_EMAIL = process.env.SOURCE_EMAIL || 'espoused@wedding.himnher.dev';
const CONFIGURATION_SET = process.env.CONFIGURATION_SET || 'wedding-rsvp-production';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://wedding.himnher.dev';
const EMAIL_QUEUE_URL = process.env.EMAIL_QUEUE_URL || '';
const DLQ_URL = process.env.DLQ_URL || '';

// SES rate limits (adjust based on your account)
const MAX_SEND_RATE = 14; // Maximum emails per second
const BATCH_SIZE = 50; // Maximum destinations per bulk send

interface EmailQueueMessage {
  type: 'bulk' | 'single';
  templateType: 'confirmation' | 'update' | 'reminder';
  recipients: Array<{
    email: string;
    name: string;
    templateData: TemplateData;
    guestId?: string;
    eventId?: string;
  }>;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Calculate exponential backoff delay
 */
const calculateBackoffDelay = (retryCount: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 300000; // 5 minutes
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Process a batch of emails with rate limiting
 */
const processBatch = async (
  recipients: EmailQueueMessage['recipients'],
  templateType: EmailQueueMessage['templateType']
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> => {
  const successful: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  // Process in chunks respecting SES batch size limit
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);

    try {
      // For bulk sending, we need to use a template
      // For this implementation, we'll send individually to maintain flexibility
      for (const recipient of chunk) {
        try {
          const templateData: TemplateData = {
            ...recipient.templateData,
            guestName: recipient.name,
            email: recipient.email,
            websiteUrl: WEBSITE_URL,
          };

          const template = getEmailTemplate(templateType, templateData);

          // Send individual email
          const { SendEmailCommand } = await import('@aws-sdk/client-ses');
          const command = new SendEmailCommand({
            Source: SOURCE_EMAIL,
            Destination: {
              ToAddresses: [recipient.email],
            },
            Message: {
              Subject: {
                Data: template.subject,
                Charset: 'UTF-8',
              },
              Body: {
                Html: {
                  Data: template.html,
                  Charset: 'UTF-8',
                },
                Text: {
                  Data: template.text,
                  Charset: 'UTF-8',
                },
              },
            },
            ConfigurationSetName: CONFIGURATION_SET,
          });

          await sesClient.send(command);
          successful.push(recipient.email);

          logger.info('Email sent successfully', {
            email: recipient.email,
            templateType,
          });

          // Rate limiting: sleep to respect SES send rate
          await new Promise((resolve) => setTimeout(resolve, 1000 / MAX_SEND_RATE));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failed.push({ email: recipient.email, error: errorMessage });

          logger.error('Failed to send email', {
            email: recipient.email,
            error: errorMessage,
          });
        }
      }
    } catch (error) {
      // Batch-level error
      logger.error('Failed to process email batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
        batchSize: chunk.length,
      });

      // Mark all recipients in this chunk as failed
      for (const recipient of chunk) {
        failed.push({
          email: recipient.email,
          error: 'Batch processing error',
        });
      }
    }
  }

  return { successful, failed };
};

/**
 * Requeue failed messages with exponential backoff
 */
const requeueFailedMessages = async (
  message: EmailQueueMessage,
  failedRecipients: Array<{ email: string; error: string }>
): Promise<void> => {
  const retryCount = (message.retryCount || 0) + 1;
  const maxRetries = message.maxRetries || 5;

  if (retryCount >= maxRetries) {
    // Move to DLQ
    logger.error('Max retries exceeded, moving to DLQ', {
      retryCount,
      maxRetries,
      failedCount: failedRecipients.length,
    });

    if (DLQ_URL) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: DLQ_URL,
          MessageBody: JSON.stringify({
            ...message,
            recipients: failedRecipients.map(
              (f) => message.recipients.find((r) => r.email === f.email)!
            ),
            failureReason: 'Max retries exceeded',
            failures: failedRecipients,
          }),
        })
      );
    }
    return;
  }

  // Requeue with exponential backoff
  const delay = calculateBackoffDelay(retryCount);

  logger.info('Requeueing failed messages', {
    retryCount,
    delay,
    failedCount: failedRecipients.length,
  });

  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: EMAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        ...message,
        recipients: failedRecipients.map(
          (f) => message.recipients.find((r) => r.email === f.email)!
        ),
        retryCount,
      }),
      DelaySeconds: Math.min(Math.floor(delay / 1000), 900), // Max 15 minutes
    })
  );
};

/**
 * Lambda handler for processing email queue messages
 */
export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;

  logger.info('Processing email queue messages', {
    requestId,
    messageCount: event.Records.length,
  });

  for (const record of event.Records) {
    try {
      const message: EmailQueueMessage = JSON.parse(record.body);

      logger.info('Processing email queue message', {
        requestId,
        messageId: record.messageId,
        type: message.type,
        templateType: message.templateType,
        recipientCount: message.recipients.length,
        retryCount: message.retryCount || 0,
      });

      // Process the batch
      const { successful, failed } = await processBatch(message.recipients, message.templateType);

      logger.info('Batch processing complete', {
        requestId,
        successfulCount: successful.length,
        failedCount: failed.length,
      });

      // Requeue failed messages if any
      if (failed.length > 0) {
        await requeueFailedMessages(message, failed);
      }

      // Log completion
      if (successful.length === message.recipients.length) {
        logger.info('All emails sent successfully', {
          requestId,
          count: successful.length,
        });
      } else {
        logger.warn('Partial batch success', {
          requestId,
          successful: successful.length,
          failed: failed.length,
          totalAttempted: message.recipients.length,
        });
      }
    } catch (error) {
      logger.error('Failed to process queue message', {
        requestId,
        messageId: record.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // The message will be retried by SQS based on queue configuration
      throw error;
    }
  }
};
