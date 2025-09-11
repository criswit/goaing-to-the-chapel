import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { TemplateData } from '../email-templates/templates';
import { logger } from './utils';

interface RsvpData {
  guest_name?: string;
  guestName?: string;
  email: string;
  rsvp_status?: string;
  rsvpStatus?: string;
  attendee_count?: number;
  attendeeCount?: number;
  plus_ones?: Array<{ name: string; ageGroup?: string }>;
  plusOnes?: Array<{ name: string; ageGroup?: string }>;
  dietary_restrictions?: string[];
  dietaryRestrictions?: string[];
  special_requests?: string;
  specialRequests?: string;
  confirmation_number?: string;
  confirmationNumber?: string;
  party_id?: string;
  partyId?: string;
}

const sqsClient = new SQSClient({});
const EMAIL_QUEUE_URL = process.env.EMAIL_QUEUE_URL || '';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://wedding.himnher.dev';

export interface EmailRequest {
  templateType: 'confirmation' | 'update' | 'reminder';
  recipientEmail: string;
  recipientName: string;
  templateData: TemplateData;
  guestId?: string;
  eventId?: string;
}

/**
 * Queue an email to be sent asynchronously
 */
export const queueEmail = async (request: EmailRequest): Promise<void> => {
  if (!EMAIL_QUEUE_URL) {
    logger.warn('Email queue URL not configured, skipping email send', {
      recipientEmail: request.recipientEmail,
      templateType: request.templateType,
    });
    return;
  }

  try {
    const message = {
      type: 'single',
      templateType: request.templateType,
      recipients: [
        {
          email: request.recipientEmail,
          name: request.recipientName,
          templateData: {
            ...request.templateData,
            websiteUrl: WEBSITE_URL,
          },
          guestId: request.guestId,
          eventId: request.eventId,
        },
      ],
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: EMAIL_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      })
    );

    logger.info('Email queued successfully', {
      recipientEmail: request.recipientEmail,
      templateType: request.templateType,
      guestId: request.guestId,
    });
  } catch (error) {
    logger.error('Failed to queue email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipientEmail: request.recipientEmail,
      templateType: request.templateType,
    });
    // Don't throw - email is not critical to RSVP submission
  }
};

/**
 * Queue bulk emails for multiple recipients
 */
export const queueBulkEmails = async (
  templateType: 'confirmation' | 'update' | 'reminder',
  recipients: Array<{
    email: string;
    name: string;
    templateData: TemplateData;
    guestId?: string;
    eventId?: string;
  }>
): Promise<void> => {
  if (!EMAIL_QUEUE_URL) {
    logger.warn('Email queue URL not configured, skipping bulk email send', {
      recipientCount: recipients.length,
      templateType,
    });
    return;
  }

  try {
    const message = {
      type: 'bulk',
      templateType,
      recipients: recipients.map((r) => ({
        ...r,
        templateData: {
          ...r.templateData,
          websiteUrl: WEBSITE_URL,
        },
      })),
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: EMAIL_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      })
    );

    logger.info('Bulk emails queued successfully', {
      recipientCount: recipients.length,
      templateType,
    });
  } catch (error) {
    logger.error('Failed to queue bulk emails', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipientCount: recipients.length,
      templateType,
    });
    // Don't throw - email is not critical
  }
};

/**
 * Prepare template data for RSVP confirmation email
 */
export const prepareRsvpConfirmationData = (rsvpData: RsvpData): TemplateData => {
  return {
    guestName: rsvpData.guest_name || rsvpData.guestName || '',
    email: rsvpData.email,
    eventDate: 'February 13-14, 2026',
    eventLocation: 'Goa, India',
    rsvpStatus: rsvpData.rsvp_status || rsvpData.rsvpStatus || 'pending',
    attendeeCount: rsvpData.attendee_count || rsvpData.attendeeCount || 1,
    plusOnes: rsvpData.plus_ones || rsvpData.plusOnes || [],
    dietaryRestrictions: rsvpData.dietary_restrictions || rsvpData.dietaryRestrictions || [],
    specialRequests: rsvpData.special_requests || rsvpData.specialRequests,
    confirmationNumber: rsvpData.confirmation_number || rsvpData.confirmationNumber,
    partyId: rsvpData.party_id || rsvpData.partyId,
    websiteUrl: WEBSITE_URL,
  };
};
