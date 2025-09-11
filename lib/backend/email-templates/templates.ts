/**
 * Email templates for the wedding RSVP system
 * All templates include both HTML and plain text versions
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateData {
  guestName: string;
  email?: string;
  eventDate?: string;
  eventLocation?: string;
  rsvpStatus?: string;
  attendeeCount?: number;
  plusOnes?: Array<{ name: string; ageGroup?: string }>;
  dietaryRestrictions?: string[];
  specialRequests?: string;
  confirmationNumber?: string;
  partyId?: string;
  websiteUrl?: string;
}

/**
 * Generate RSVP confirmation email template
 */
export const getRsvpConfirmationTemplate = (data: TemplateData): EmailTemplate => {
  const {
    guestName,
    rsvpStatus,
    attendeeCount = 1,
    plusOnes = [],
    confirmationNumber,
    dietaryRestrictions = [],
    specialRequests,
    websiteUrl = 'https://wedding.himnher.dev',
  } = data;

  const attendanceMessage =
    rsvpStatus === 'attending'
      ? `We're thrilled that you'll be joining us!`
      : rsvpStatus === 'not_attending'
        ? `We're sorry you won't be able to make it, but we appreciate you letting us know.`
        : `Thank you for your response. We'll be in touch if you're able to confirm your attendance.`;

  const partyDetails =
    plusOnes.length > 0
      ? `
      <h3 style="color: #6b5b95; margin-top: 20px;">Your Party:</h3>
      <ul style="color: #333; line-height: 1.8;">
        <li>${guestName} (Primary Guest)</li>
        ${plusOnes.map((guest) => `<li>${guest.name}${guest.ageGroup ? ` (${guest.ageGroup})` : ''}</li>`).join('')}
      </ul>
    `
      : '';

  const dietaryInfo =
    dietaryRestrictions.length > 0 || specialRequests
      ? `
      <h3 style="color: #6b5b95; margin-top: 20px;">Special Requirements:</h3>
      ${dietaryRestrictions.length > 0 ? `<p><strong>Dietary Restrictions:</strong> ${dietaryRestrictions.join(', ')}</p>` : ''}
      ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ''}
    `
      : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Confirmation</title>
    </head>
    <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #6b5b95; text-align: center; font-size: 28px; margin-bottom: 10px;">
          Goa'ing to the Chapel
        </h1>
        <p style="text-align: center; color: #88B0D3; font-size: 18px; margin-bottom: 30px;">
          Aakanchha & Christopher
        </p>
        
        <h2 style="color: #6b5b95; border-bottom: 2px solid #f0e5ff; padding-bottom: 10px;">
          RSVP Confirmation
        </h2>
        
        <p style="font-size: 16px;">Dear ${guestName},</p>
        
        <p style="font-size: 16px;">${attendanceMessage}</p>
        
        ${
          confirmationNumber
            ? `
          <div style="background-color: #f0e5ff; border-left: 4px solid #6b5b95; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Confirmation Number:</strong> ${confirmationNumber}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Please save this for your records</p>
          </div>
        `
            : ''
        }
        
        ${
          rsvpStatus === 'attending'
            ? `
          <h3 style="color: #6b5b95; margin-top: 20px;">Your RSVP Details:</h3>
          <ul style="color: #333; line-height: 1.8;">
            <li><strong>Status:</strong> Attending</li>
            <li><strong>Total Guests:</strong> ${attendeeCount}</li>
            <li><strong>Event Date:</strong> February 13-14, 2026</li>
            <li><strong>Location:</strong> Goa, India</li>
          </ul>
          
          ${partyDetails}
          ${dietaryInfo}
          
          <div style="background-color: #fff9e5; border: 1px solid #ffd700; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #6b5b95; margin-top: 0;">What's Next?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Visit our <a href="${websiteUrl}/travel" style="color: #6b5b95;">Travel page</a> for flight and visa information</li>
              <li>Check out <a href="${websiteUrl}/stay" style="color: #6b5b95;">accommodation options</a> in Goa</li>
              <li>Learn about the <a href="${websiteUrl}/events" style="color: #6b5b95;">wedding events</a> and traditions</li>
            </ul>
          </div>
        `
            : ''
        }
        
        <p style="font-size: 16px; margin-top: 30px;">
          If you need to make any changes to your RSVP, please visit 
          <a href="${websiteUrl}/rsvp" style="color: #6b5b95;">${websiteUrl}/rsvp</a>
        </p>
        
        <div style="border-top: 2px solid #f0e5ff; margin-top: 30px; padding-top: 20px;">
          <p style="text-align: center; color: #666; font-size: 14px;">
            With love,<br>
            <strong>Aakanchha & Christopher</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
RSVP Confirmation - Aakanchha & Christopher's Wedding

Dear ${guestName},

${attendanceMessage}

${confirmationNumber ? `Confirmation Number: ${confirmationNumber}\nPlease save this for your records.\n` : ''}

${
  rsvpStatus === 'attending'
    ? `
Your RSVP Details:
- Status: Attending
- Total Guests: ${attendeeCount}
- Event Date: February 13-14, 2026
- Location: Goa, India

${plusOnes.length > 0 ? `Your Party:\n- ${guestName} (Primary Guest)\n${plusOnes.map((g) => `- ${g.name}${g.ageGroup ? ` (${g.ageGroup})` : ''}`).join('\n')}\n` : ''}

${dietaryRestrictions.length > 0 ? `Dietary Restrictions: ${dietaryRestrictions.join(', ')}\n` : ''}
${specialRequests ? `Special Requests: ${specialRequests}\n` : ''}

What's Next?
- Visit our Travel page for flight and visa information: ${websiteUrl}/travel
- Check out accommodation options in Goa: ${websiteUrl}/stay
- Learn about the wedding events and traditions: ${websiteUrl}/events
`
    : ''
}

If you need to make any changes to your RSVP, please visit:
${websiteUrl}/rsvp

With love,
Aakanchha & Christopher
  `.trim();

  return {
    subject: `RSVP Confirmation - ${rsvpStatus === 'attending' ? "We can't wait to see you!" : 'Thank you for your response'}`,
    html,
    text,
  };
};

/**
 * Generate RSVP update notification email template
 */
export const getRsvpUpdateTemplate = (data: TemplateData): EmailTemplate => {
  const { guestName, confirmationNumber, websiteUrl = 'https://wedding.himnher.dev' } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Updated</title>
    </head>
    <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #6b5b95; text-align: center; font-size: 28px; margin-bottom: 30px;">
          RSVP Updated Successfully
        </h1>
        
        <p style="font-size: 16px;">Dear ${guestName},</p>
        
        <p style="font-size: 16px;">
          Your RSVP has been successfully updated. Thank you for keeping us informed!
        </p>
        
        ${
          confirmationNumber
            ? `
          <div style="background-color: #f0e5ff; border-left: 4px solid #6b5b95; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Updated Confirmation Number:</strong> ${confirmationNumber}</p>
          </div>
        `
            : ''
        }
        
        <p style="font-size: 16px;">
          To view or make additional changes to your RSVP, please visit:
          <a href="${websiteUrl}/rsvp" style="color: #6b5b95;">${websiteUrl}/rsvp</a>
        </p>
        
        <div style="border-top: 2px solid #f0e5ff; margin-top: 30px; padding-top: 20px;">
          <p style="text-align: center; color: #666; font-size: 14px;">
            With love,<br>
            <strong>Aakanchha & Christopher</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
RSVP Updated Successfully

Dear ${guestName},

Your RSVP has been successfully updated. Thank you for keeping us informed!

${confirmationNumber ? `Updated Confirmation Number: ${confirmationNumber}\n` : ''}

To view or make additional changes to your RSVP, please visit:
${websiteUrl}/rsvp

With love,
Aakanchha & Christopher
  `.trim();

  return {
    subject: "RSVP Updated - Aakanchha & Christopher's Wedding",
    html,
    text,
  };
};

/**
 * Generate reminder email template for non-respondents
 */
export const getReminderTemplate = (data: TemplateData): EmailTemplate => {
  const { guestName, websiteUrl = 'https://wedding.himnher.dev' } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Reminder</title>
    </head>
    <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #6b5b95; text-align: center; font-size: 28px; margin-bottom: 10px;">
          Save the Date!
        </h1>
        <p style="text-align: center; color: #88B0D3; font-size: 18px; margin-bottom: 30px;">
          February 13-14, 2026 • Goa, India
        </p>
        
        <p style="font-size: 16px;">Dear ${guestName},</p>
        
        <p style="font-size: 16px;">
          We hope this message finds you well! We wanted to remind you that we haven't received your RSVP 
          for our wedding celebration yet.
        </p>
        
        <p style="font-size: 16px;">
          We would love to have you join us in Goa as we celebrate our special day. To help us with our 
          planning, please let us know if you'll be able to attend.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${websiteUrl}/rsvp" style="display: inline-block; background-color: #6b5b95; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px;">
            RSVP Now
          </a>
        </div>
        
        <div style="background-color: #fff9e5; border: 1px solid #ffd700; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #6b5b95; margin-top: 0;">Event Details:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>When:</strong> February 13-14, 2026</li>
            <li><strong>Where:</strong> Goa, India</li>
            <li><strong>Website:</strong> <a href="${websiteUrl}" style="color: #6b5b95;">${websiteUrl}</a></li>
          </ul>
        </div>
        
        <p style="font-size: 16px;">
          If you have any questions or need assistance with travel planning, please don't hesitate to reach out.
        </p>
        
        <div style="border-top: 2px solid #f0e5ff; margin-top: 30px; padding-top: 20px;">
          <p style="text-align: center; color: #666; font-size: 14px;">
            We hope to see you there!<br><br>
            With love,<br>
            <strong>Aakanchha & Christopher</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Save the Date - RSVP Reminder

Dear ${guestName},

We hope this message finds you well! We wanted to remind you that we haven't received your RSVP for our wedding celebration yet.

We would love to have you join us in Goa as we celebrate our special day. To help us with our planning, please let us know if you'll be able to attend.

Event Details:
- When: February 13-14, 2026
- Where: Goa, India
- Website: ${websiteUrl}

Please RSVP at: ${websiteUrl}/rsvp

If you have any questions or need assistance with travel planning, please don't hesitate to reach out.

We hope to see you there!

With love,
Aakanchha & Christopher
  `.trim();

  return {
    subject: "RSVP Reminder - Aakanchha & Christopher's Wedding",
    html,
    text,
  };
};

/**
 * Get template by type
 */
export const getEmailTemplate = (
  templateType: 'confirmation' | 'update' | 'reminder',
  data: TemplateData
): EmailTemplate => {
  switch (templateType) {
    case 'confirmation':
      return getRsvpConfirmationTemplate(data);
    case 'update':
      return getRsvpUpdateTemplate(data);
    case 'reminder':
      return getReminderTemplate(data);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
};
