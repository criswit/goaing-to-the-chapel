# Amazon WorkMail Setup Guide

This guide explains how to set up Amazon WorkMail for the `wedding.himnher.dev` domain with the organization alias `goaing-to-the-chapel`.

## Overview

Amazon WorkMail is a managed business email service that provides:
- Professional email addresses (@wedding.himnher.dev)
- Webmail access
- Calendar and contacts
- Mobile device support
- Integration with email clients (Outlook, Mail, etc.)

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Domain already configured in Route53 (wedding.himnher.dev)

## Setup Process

### Step 1: Deploy DNS Records

First, deploy the updated DNS records that support WorkMail:

```bash
npm run build
npx cdk deploy RsvpBackendStack
```

This will add:
- MX record for email routing
- AutoDiscover CNAME for email client configuration
- SPF record including WorkMail
- DMARC record for email authentication

### Step 2: Create WorkMail Organization

Run the setup script to create the WorkMail organization:

```bash
./scripts/setup-workmail.sh
```

This script will:
1. Create a KMS key for encryption
2. Create the WorkMail organization with alias `goaing-to-the-chapel`
3. Register the `wedding.himnher.dev` domain
4. Set it as the default domain

### Step 3: Configure Users in AWS Console

1. Go to the [AWS WorkMail Console](https://console.aws.amazon.com/workmail/)
2. Select the `goaing-to-the-chapel` organization
3. Create users:
   - Click "Users" → "Create user"
   - Set username (e.g., `admin`, `info`, `rsvp`)
   - Set display name and password
   - The email address will be `username@wedding.himnher.dev`

### Step 4: Create Distribution Groups (Optional)

1. In WorkMail Console, click "Groups"
2. Create groups like:
   - `wedding@wedding.himnher.dev` - General wedding inquiries
   - `rsvp@wedding.himnher.dev` - RSVP responses
   - `info@wedding.himnher.dev` - Information requests

### Step 5: Access Email

#### Webmail Access
- URL: `https://goaing-to-the-chapel.awsapps.com/mail`
- Login with username and password created in Step 3

#### Email Client Configuration
Configure email clients (Outlook, Apple Mail, etc.) with:
- **Server**: `outlook.us-east-1.amazonaws.com` (adjust region if needed)
- **Protocol**: EWS (Exchange Web Services)
- **Username**: Full email address (e.g., `admin@wedding.himnher.dev`)
- **Password**: User's password

#### Mobile Device Setup
- **iOS**: Add account as "Exchange" type
- **Android**: Add account as "Exchange" or "Corporate" type
- Use the same server settings as above

## Email Addresses Available

After setup, you can create email addresses like:
- `admin@wedding.himnher.dev` - Administrator
- `info@wedding.himnher.dev` - General information
- `rsvp@wedding.himnher.dev` - RSVP responses
- `wedding@wedding.himnher.dev` - Main wedding email
- Any custom usernames you create

## Cost Considerations

WorkMail pricing (as of 2024):
- $4 per user per month
- First 25 users get 30-day free trial
- Storage: 50 GB per user mailbox
- No charge for distribution groups

## Integration with Existing Infrastructure

The WorkMail setup integrates with:
- **SES**: Both services can coexist, sharing the same domain
- **Route53**: DNS records support both WorkMail and SES
- **RSVP System**: Automated emails sent via SES, received via WorkMail

## Troubleshooting

### Domain Verification Issues
- Ensure DNS records have propagated (can take up to 48 hours)
- Check Route53 for correct MX and AutoDiscover records

### Cannot Access Webmail
- Verify organization alias is correct: `goaing-to-the-chapel`
- Ensure user is created and enabled in WorkMail console

### Email Client Connection Issues
- Use full email address as username
- Ensure using correct server for your region
- Try autodiscover URL: `https://autodiscover.wedding.himnher.dev/autodiscover/autodiscover.xml`

## Security Best Practices

1. **Enable MFA**: Require multi-factor authentication for all users
2. **Strong Passwords**: Enforce complex password requirements
3. **Access Policies**: Create access control policies in WorkMail console
4. **Encryption**: All emails are encrypted at rest (KMS) and in transit (TLS)

## Maintenance

### Adding New Users
```bash
# Via AWS Console (recommended) or AWS CLI:
aws workmail create-user \
  --organization-id <ORG_ID> \
  --name newuser \
  --display-name "New User" \
  --password "SecurePassword123!"
```

### Monitoring
- Check WorkMail console for usage statistics
- Monitor AWS CloudWatch for service health
- Review access logs regularly

## Removing WorkMail (If Needed)

To remove WorkMail:
1. Delete all users and groups in WorkMail console
2. Deregister the domain from the organization
3. Delete the organization
4. Remove WorkMail-specific DNS records if not needed

## Support

- AWS WorkMail Documentation: https://docs.aws.amazon.com/workmail/
- AWS Support: Available through AWS Console
- Email Issues: Check CloudWatch logs and WorkMail console metrics