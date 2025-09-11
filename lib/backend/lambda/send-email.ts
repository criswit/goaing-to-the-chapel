/* eslint-disable @typescript-eslint/no-explicit-any */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getEmailTemplate, TemplateData } from '../email-templates/templates';
import { createResponse, logger, getCurrentTimestamp } from './utils';

const sesClient = new SESClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || 'wedding-rsvp-production';
const SOURCE_EMAIL = process.env.SOURCE_EMAIL || 'espoused@wedding.himnher.dev';
const CONFIGURATION_SET = process.env.CONFIGURATION_SET || 'wedding-rsvp-production';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://wedding.himnher.dev';
const SES_SANDBOX_MODE = process.env.SES_SANDBOX_MODE === 'true';

interface EmailRequest {
  templateType: 'confirmation' | 'update' | 'reminder';
  recipientEmail: string;
  recipientName: string;
  templateData: TemplateData;
  guestId?: string;
  eventId?: string;
}

/**
 * Send an email using AWS SES
 */
const sendEmail = async (
  recipientEmail: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<any> => {
  // In sandbox mode, skip sending to test addresses
  if (SES_SANDBOX_MODE && recipientEmail.includes('@example.com')) {
    logger.info('Skipping email in sandbox mode for test address', {
      recipientEmail,
      subject,
      sandboxMode: true,
    });
    return;
  }

  const params: SendEmailCommandInput = {
    Source: SOURCE_EMAIL,
    Destination: {
      ToAddresses: [recipientEmail],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
    ConfigurationSetName: CONFIGURATION_SET,
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    logger.info('Email sent successfully', {
      messageId: result.MessageId,
      recipientEmail,
      subject,
    });
  } catch (error: any) {
    // Check if this is a verification error (SES sandbox mode)
    if (error.name === 'MessageRejected' && error.message?.includes('not verified')) {
      logger.warn('Email not sent - SES sandbox mode (addresses not verified)', {
        recipientEmail,
        subject,
        errorMessage: error.message,
        note: 'In SES sandbox mode, both sender and recipient must be verified',
        sandboxMode: SES_SANDBOX_MODE,
      });

      // In sandbox mode, don't throw - just log and continue
      if (SES_SANDBOX_MODE) {
        return {
          MessageId: `sandbox-skipped-${Date.now()}`,
          $metadata: {
            httpStatusCode: 200,
            requestId: 'sandbox-mode',
          },
        };
      }
    }

    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error.name,
      recipientEmail,
      subject,
    });
    throw error;
  }
};

/**
 * Update email status in DynamoDB
 */
const updateEmailStatus = async (
  guestId: string,
  eventId: string,
  emailType: string,
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> => {
  const timestamp = getCurrentTimestamp();
  const updateExpression =
    status === 'sent'
      ? 'SET last_email_sent = :timestamp, last_email_type = :emailType, last_email_message_id = :messageId, updated_at = :timestamp'
      : 'SET last_email_failed = :timestamp, last_email_error = :error, updated_at = :timestamp';

  const expressionAttributeValues =
    status === 'sent'
      ? {
          ':timestamp': timestamp,
          ':emailType': emailType,
          ':messageId': messageId,
        }
      : {
          ':timestamp': timestamp,
          ':error': error,
        };

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `GUEST#${guestId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  } catch (error) {
    logger.error('Failed to update email status in DynamoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
      guestId,
      eventId,
      emailType,
      status,
    });
    // Don't throw - email was sent, just couldn't update status
  }
};

/**
 * Lambda handler for sending emails
 * This can be invoked directly by API Gateway or through SQS
 */
export const handler = async (
  event: APIGatewayProxyEvent | SQSEvent,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  const requestId = context.awsRequestId;

  logger.info('Processing email send request', {
    requestId,
    eventType: 'Records' in event ? 'SQS' : 'API',
  });

  try {
    // Handle SQS batch processing
    if ('Records' in event) {
      for (const record of event.Records) {
        try {
          const emailRequest: EmailRequest = JSON.parse(record.body);
          await processEmailRequest(emailRequest, requestId);
        } catch (error) {
          logger.error('Failed to process SQS message', {
            requestId,
            messageId: record.messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error; // Throw to retry with SQS
        }
      }
      return;
    }

    // Handle direct API Gateway invocation
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required',
      });
    }

    const emailRequest: EmailRequest = JSON.parse(event.body);

    // Validate required fields
    if (!emailRequest.templateType || !emailRequest.recipientEmail || !emailRequest.recipientName) {
      return createResponse(400, {
        success: false,
        error: 'Missing required fields: templateType, recipientEmail, recipientName',
      });
    }

    await processEmailRequest(emailRequest, requestId);

    return createResponse(200, {
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    logger.error('Error processing email request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // For SQS, throw to retry
    if ('Records' in event) {
      throw error;
    }

    // For API Gateway, return error response
    return createResponse(500, {
      success: false,
      error: 'Failed to send email',
    });
  }
};

/**
 * Process a single email request
 */
async function processEmailRequest(emailRequest: EmailRequest, requestId: string): Promise<void> {
  const { templateType, recipientEmail, recipientName, templateData, guestId, eventId } =
    emailRequest;

  logger.info('Processing email request', {
    requestId,
    templateType,
    recipientEmail,
    recipientName,
  });

  // Add website URL to template data
  const enrichedTemplateData: TemplateData = {
    ...templateData,
    guestName: recipientName,
    email: recipientEmail,
    websiteUrl: WEBSITE_URL,
  };

  // Get the appropriate template
  const template = getEmailTemplate(templateType, enrichedTemplateData);

  // Send the email
  try {
    await sendEmail(recipientEmail, template.subject, template.html, template.text);

    // Update email status in DynamoDB if guest and event IDs are provided
    if (guestId && eventId) {
      await updateEmailStatus(guestId, eventId, templateType, 'sent', requestId);
    }

    logger.info('Email processed successfully', {
      requestId,
      templateType,
      recipientEmail,
    });
  } catch (error) {
    // Update email status as failed
    if (guestId && eventId) {
      await updateEmailStatus(
        guestId,
        eventId,
        templateType,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    throw error;
  }
}
