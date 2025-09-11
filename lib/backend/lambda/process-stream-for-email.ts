/* eslint-disable @typescript-eslint/no-explicit-any */

import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { logger } from './utils';

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://wedding.himnher.dev';

interface EmailMessage {
  templateType: 'confirmation' | 'update' | 'reminder';
  recipientEmail: string;
  recipientName: string;
  templateData: Record<string, unknown>;
  guestId?: string;
  eventId?: string;
}

/**
 * Process DynamoDB stream records and transform them into email messages
 * This function is called by EventBridge Pipes as an enrichment step
 *
 * EventBridge Pipes with SQS target expects the enrichment to return
 * an array where each element becomes a separate SQS message
 */
export const handler = async (event: any): Promise<any[]> => {
  // Log the raw event for debugging
  logger.info('🔍 STREAM PROCESSOR START - Raw event received', {
    eventType: typeof event,
    isArray: Array.isArray(event),
    eventKeys: event ? Object.keys(event) : [],
    rawEvent: JSON.stringify(event, null, 2).substring(0, 5000), // Truncate for logging
  });

  // EventBridge Pipes sends an array of records for batch processing
  const records = Array.isArray(event) ? event : [event];

  logger.info('📦 Processing stream records batch', {
    recordCount: records.length,
    firstRecordKeys: records[0] ? Object.keys(records[0]) : [],
    firstRecordEventName: records[0]?.eventName,
  });

  const sqsMessages: any[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    logger.info(`📝 Processing record ${i + 1}/${records.length}`, {
      recordIndex: i,
      eventName: record.eventName,
      eventSource: record.eventSource,
      recordKeys: record ? Object.keys(record) : [],
      hasDynamodb: !!record.dynamodb,
    });

    try {
      // Only process INSERT and MODIFY events for RSVP records
      if (!['INSERT', 'MODIFY'].includes(record.eventName || '')) {
        logger.info('⏭️ Skipping non-INSERT/MODIFY event', {
          eventName: record.eventName,
          recordIndex: i,
        });
        continue;
      }

      const streamRecord = record.dynamodb;
      if (!streamRecord) {
        logger.warn('⚠️ No dynamodb field in record', {
          recordIndex: i,
          recordStructure: Object.keys(record),
        });
        continue;
      }

      logger.info('🔑 Checking record keys', {
        recordIndex: i,
        hasKeys: !!streamRecord.Keys,
        hasPK: !!streamRecord.Keys?.PK,
        hasSK: !!streamRecord.Keys?.SK,
        PK: streamRecord.Keys?.PK?.S,
        SK: streamRecord.Keys?.SK?.S,
      });

      // Check if this is an RSVP record
      const keys = streamRecord.Keys;
      if (!keys?.SK?.S?.startsWith('RSVP#')) {
        logger.info('⏭️ Not an RSVP record, skipping', {
          SK: keys?.SK?.S,
          PK: keys?.PK?.S,
          recordIndex: i,
        });
        continue;
      }

      // Get the new image (current state of the item)
      const newImage = streamRecord.NewImage;
      if (!newImage) {
        logger.warn('⚠️ No NewImage in stream record', {
          recordIndex: i,
          hasOldImage: !!streamRecord.OldImage,
          eventName: record.eventName,
        });
        continue;
      }

      logger.info('📋 Unmarshalling DynamoDB record', {
        recordIndex: i,
        newImageKeys: Object.keys(newImage),
        hasGuestEmail: !!newImage.guest_email,
        hasGuestName: !!newImage.guest_name,
      });

      // Unmarshall the DynamoDB record
      const item = unmarshall(newImage as Record<string, AttributeValue>);

      logger.info('✅ Record unmarshalled successfully', {
        recordIndex: i,
        itemKeys: Object.keys(item),
        guestEmail: item.guest_email,
        guestName: item.guest_name,
        rsvpStatus: item.rsvp_status,
        confirmationNumber: item.confirmation_number,
      });

      // Extract relevant fields
      const guestEmail = item.guest_email;
      const guestName = item.guest_name;
      const eventId = item.event_id;
      const rsvpStatus = item.rsvp_status;
      const attendeeCount = item.attendee_count || 1;
      const confirmationNumber = item.confirmation_number;
      const eventName = item.event_name || 'Our Wedding';
      const eventDate = item.event_date;
      const eventLocation = item.event_location || '';
      const plusOnes = item.plus_ones || [];
      const dietaryRestrictions = item.dietary_restrictions;
      const specialRequests = item.special_requests;

      // Check if we should send an email
      let shouldSendEmail = false;
      let templateType: 'confirmation' | 'update' = 'confirmation';

      if (record.eventName === 'INSERT') {
        // New RSVP - always send confirmation
        shouldSendEmail = true;
        templateType = 'confirmation';
        logger.info('✉️ INSERT event - will send confirmation email', {
          recordIndex: i,
          guestEmail,
        });
      } else if (record.eventName === 'MODIFY') {
        // Check if RSVP status changed
        const oldImage = streamRecord.OldImage;
        if (oldImage) {
          const oldItem = unmarshall(oldImage as Record<string, AttributeValue>);
          const statusChanged = oldItem.rsvp_status !== rsvpStatus;

          logger.info('🔄 MODIFY event - checking for changes', {
            recordIndex: i,
            oldStatus: oldItem.rsvp_status,
            newStatus: rsvpStatus,
            statusChanged,
            oldAttendeeCount: oldItem.attendee_count,
            newAttendeeCount: attendeeCount,
          });

          if (statusChanged) {
            // Status changed - send update email
            shouldSendEmail = true;
            templateType = 'update';
            logger.info('📨 Status changed - will send update email', {
              recordIndex: i,
              oldStatus: oldItem.rsvp_status,
              newStatus: rsvpStatus,
            });
          }
        } else {
          logger.warn('⚠️ MODIFY event but no OldImage', {
            recordIndex: i,
          });
        }
      }

      logger.info('📧 Email decision', {
        recordIndex: i,
        shouldSendEmail,
        hasGuestEmail: !!guestEmail,
        hasGuestName: !!guestName,
        guestEmail,
        guestName,
        templateType,
      });

      if (shouldSendEmail && guestEmail && guestName) {
        const emailMessage: EmailMessage = {
          templateType,
          recipientEmail: guestEmail,
          recipientName: guestName,
          templateData: {
            guestName,
            eventName,
            eventDate,
            eventLocation,
            rsvpStatus,
            attendeeCount,
            confirmationNumber,
            plusOnes,
            dietaryRestrictions,
            specialRequests,
            websiteUrl: WEBSITE_URL,
            email: guestEmail,
          },
          guestId: guestEmail,
          eventId,
        };

        // For EventBridge Pipes to SQS, each element in the returned array
        // becomes a separate SQS message. The entire object becomes the message body.
        sqsMessages.push(emailMessage);

        logger.info('✅ Email message prepared and added to queue', {
          recordIndex: i,
          messageIndex: sqsMessages.length - 1,
          templateType,
          recipientEmail: guestEmail,
          eventId,
          rsvpStatus,
          confirmationNumber,
          attendeeCount,
        });
      } else {
        logger.info('⏭️ Not sending email for this record', {
          recordIndex: i,
          shouldSendEmail,
          hasGuestEmail: !!guestEmail,
          hasGuestName: !!guestName,
          reason: !shouldSendEmail
            ? 'No email trigger'
            : !guestEmail
              ? 'Missing guest email'
              : !guestName
                ? 'Missing guest name'
                : 'Unknown',
        });
      }
    } catch (error) {
      logger.error('❌ Error processing stream record', {
        recordIndex: i,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        recordEventName: record.eventName,
        recordKeys: record ? Object.keys(record) : [],
      });
      // Continue processing other records
    }
  }

  logger.info('🚀 STREAM PROCESSOR COMPLETE - Returning enriched messages', {
    messageCount: sqsMessages.length,
    messages: sqsMessages.map((msg, idx) => ({
      index: idx,
      templateType: msg.templateType,
      recipientEmail: msg.recipientEmail,
      eventId: msg.eventId,
    })),
    totalRecordsProcessed: records.length,
  });

  // Log the actual return value for debugging
  if (sqsMessages.length > 0) {
    logger.info('📤 Sample message structure', {
      firstMessage: JSON.stringify(sqsMessages[0], null, 2),
    });
  } else {
    logger.warn('⚠️ No messages to send to SQS queue');
  }

  // Return array of messages for SQS
  // EventBridge Pipes will send each element as a separate SQS message
  return sqsMessages;
};
