# Email Sender Update - espoused@wedding.himnher.dev

## Overview
The RSVP response emails have been updated to be sent from `espoused@wedding.himnher.dev` instead of `noreply@wedding.himnher.dev`.

## Changes Made

### 1. Lambda Functions Updated
- **send-email.ts**: Updated `SOURCE_EMAIL` default to `espoused@wedding.himnher.dev`
- **process-email-queue.ts**: Updated `SOURCE_EMAIL` default to `espoused@wedding.himnher.dev`

### 2. CDK Infrastructure Updated
- **email-lambdas.ts**: Updated Lambda environment variable `SOURCE_EMAIL` to use `espoused@${props.domainName}`
- **email-stream-processor.ts**: Updated stream processor environment variable `SOURCE_EMAIL` to use `espoused@${props.domainName}`

## Deployment Steps

### 1. Deploy the Updated Infrastructure
```bash
npm run build
npx cdk deploy RsvpBackendStack
```

### 2. Verify Email Address (if using WorkMail)
If you've set up WorkMail:
1. Create the `espoused` user in WorkMail console
2. Set up the email address `espoused@wedding.himnher.dev`
3. The domain is already verified, so the email will work immediately

### 3. Verify Email Address (if NOT using WorkMail)
If you're only using SES without WorkMail:
1. Go to AWS SES Console
2. Navigate to "Verified identities"
3. Add `espoused@wedding.himnher.dev` as a verified email
4. Complete the verification process

## Email Types Affected

All RSVP-related emails will now come from `espoused@wedding.himnher.dev`:
- RSVP Confirmation emails
- RSVP Update notifications
- RSVP Reminder emails
- Any future automated emails from the RSVP system

## Testing

After deployment, test the email sending:
1. Submit a test RSVP through the website
2. Verify that the confirmation email comes from `espoused@wedding.himnher.dev`
3. Check that the email displays properly with the correct "From" address

## Rollback

If you need to revert to the previous sender:
1. Update the Lambda environment variables back to `noreply@wedding.himnher.dev`
2. Redeploy: `npx cdk deploy RsvpBackendStack`

## Notes

- The email templates themselves don't contain hardcoded sender addresses
- The sender email is configured via environment variables for flexibility
- Make sure `espoused@wedding.himnher.dev` is properly set up in either WorkMail or verified in SES before deploying