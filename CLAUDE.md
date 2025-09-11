## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

- use the playwright MCP frequently . YOU MUST validate your development work using the playwright MCP before you ever consider yourself done with a task.

## AWS Profile Configuration

**IMPORTANT: This project uses a specific AWS profile for all AWS operations.**

All AWS CLI commands and CDK deployments must use the `wedding-website` profile:

```bash
# If you get invalid credentials errors, authenticate first:
aws sso login --profile wedding-website

# All AWS commands should include --profile wedding-website:
aws sts get-caller-identity --profile wedding-website
aws ses verify-email-identity --email-address espoused@wedding.himnher.dev --profile wedding-website
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*" --profile wedding-website

# CDK commands should use the profile:
npx cdk deploy RsvpBackendStack --profile wedding-website
```

## Wedding Website Project Context

This is a full-stack AWS CDK wedding RSVP system with:
- React TypeScript frontend hosted on CloudFront (domain: `wedding.himnher.dev`)
- Serverless backend with Lambda + DynamoDB (API domain: `api.wedding.himnher.dev`)
- Custom domain configuration with SES/WorkMail email integration
- JWT-based admin panel for guest management at `/admin/login`
- CSV-based guest list import system with auto-generated invitation codes
- DynamoDB single-table design with GSI access patterns

## Critical Post-Deployment Setup

**REQUIRED after any backend deployment (these steps are often missed):**

```bash
# 1. Deploy backend infrastructure first
npm run build
npx cdk deploy RsvpBackendStack --profile wedding-website

# 2. Create admin user (MUST DO - admin panel won't work without this)
node scripts/create-admin-user.js
# OR use justfile command
just setup-admin

# 3. Import guest list (MUST DO - no guests means no RSVPs)
node scripts/import-guests.js your-guests.csv --dry-run  # Test first
node scripts/import-guests.js your-guests.csv            # Actual import
# OR use justfile command
just import-guests

# 4. Test CORS functionality (CRITICAL - commonly broken)
just test-cors
# OR manual test
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" -v

# 5. Verify admin panel access
just test-admin-login
# OR manual test: visit https://wedding.himnher.dev/admin/login
```

## CORS Issue Resolution

**CORS is the most common deployment issue.** Always test after deployment:

```bash
# Test CORS functionality (run after every deployment)
just test-cors

# If CORS fails, check these common issues:
# 1. Custom domain api.wedding.himnher.dev may have CloudFront routing issues
# 2. Use direct API Gateway URLs as reliable fallback:
#    - Main API: https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/
#    - Admin API: https://t7w8s73kf3.execute-api.us-east-1.amazonaws.com/prod/

# Apply CORS fixes
npx cdk deploy RsvpBackendStack --require-approval never --profile wedding-website
just update-cors

# Clear CloudFront cache if custom domain issues persist
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*" --profile wedding-website
```

## Admin Panel Requirements

**Admin Panel Setup (Critical for guest management):**

- **URLs**: 
  - Production: `https://wedding.himnher.dev/admin/login`
  - Local: `http://localhost:3000/admin/login`
- **Authentication**: JWT-based with DynamoDB user storage
- **Required Tables**: `WeddingAdmins` (created by CDK deployment)
- **Default Admin**: Must be created via script (no default login exists)

**Admin Creation Process:**
```bash
# Interactive admin creation (recommended)
node scripts/create-admin-user.js

# Follow prompts for:
# - Email address (used for login)
# - Name (display name)
# - Password (min 8 characters)
# - Role (ADMIN or SUPER_ADMIN)
```

**Admin Panel Features:**
- Dashboard: RSVP statistics, guest counts, attendance breakdown
- Guest List: View/edit all guests, search/filter, RSVP status management
- Bulk Operations: CSV import, bulk invitations, mass updates
- Export Data: CSV exports, reports, seating charts

## Guest List Management & CSV Import

**Required CSV Format:**
```csv
name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact,tableNumber,dietaryRestrictions,notes
John Smith,john.smith@email.com,+1-555-0001,1,Smith Family,smith-family,true,1,Vegetarian,College friend
```

**Key CSV Rules:**
- **Email addresses must be unique** (used for RSVP authentication)
- **Invitation codes are auto-generated** (format: first 2 letters of first name + first letter of last name + 3 digits, e.g., "JOS123")
- **Groups allow family/couple management** with designated primary contact
- **Always test imports with --dry-run flag first**

**Import Commands:**
```bash
# Test import (validates format, shows generated codes, no database changes)
node scripts/import-guests.js your-guests.csv --dry-run

# Actual import
node scripts/import-guests.js your-guests.csv

# Generate invitation codes report
node scripts/import-guests.js your-guests.csv --generate-report
```

## Email Infrastructure Configuration

**Current Email Setup:**
- **Sender Address**: `espoused@wedding.himnher.dev`
- **Email Types**: RSVP confirmations, updates, reminders, notifications
- **Templates**: Stored in `lib/backend/email-templates/`

**Email Configuration Options:**

1. **SES Only (Simpler):**
```bash
# Verify sender email in SES console
aws ses verify-email-identity --email-address espoused@wedding.himnher.dev --profile wedding-website
```

2. **WorkMail + SES (Full Email Hosting):**
```bash
# Set up WorkMail organization
./scripts/setup-workmail.sh

# Access webmail at: https://goaing-to-the-chapel.awsapps.com/mail
# Organization alias: goaing-to-the-chapel
```

**Email Verification Requirements:**
- All sender addresses must be verified in SES
- WorkMail setup optional but provides full email hosting
- Email templates configured via Lambda environment variables

## Database Schema & Performance

### DynamoDB Tables Overview

**Production Tables (Region: us-east-1):**
1. `WeddingAdmins` - Admin user authentication and management
2. `wedding-rsvp-production` - Main guest data and RSVP information

### Table 1: WeddingAdmins

**Purpose**: Stores admin user accounts for the wedding management dashboard

**Table Configuration:**
- **Table Name**: `WeddingAdmins`
- **Primary Key**: `email` (String) - Partition key only
- **Billing Mode**: PAY_PER_REQUEST (On-demand)
- **Encryption**: AWS managed keys
- **Item Count**: ~1-5 (admin users only)

**Schema:**
```json
{
  "email": "admin@wedding.himnher.dev",      // PK - Admin email address
  "name": "Admin Name",                       // Display name
  "passwordHash": "$2a$10$...",              // Bcrypt hashed password
  "role": "SUPER_ADMIN | ADMIN",             // User role level
  "createdAt": "2025-09-11T07:58:13.150Z",   // Account creation timestamp
  "lastLogin": "2025-09-11T09:55:50.830Z"    // Last successful login
}
```

### Table 2: wedding-rsvp-production

**Purpose**: Main table for guest data, RSVP responses, and event management using single-table design

**Table Configuration:**
- **Table Name**: `wedding-rsvp-production`
- **Primary Key**: 
  - Partition Key (PK): String - Entity identifier (e.g., "GUEST#abc123")
  - Sort Key (SK): String - Entity sub-type (e.g., "PROFILE", "RSVP")
- **Billing Mode**: PAY_PER_REQUEST (On-demand)
- **Encryption**: KMS with customer managed key
- **Stream**: Enabled (NEW_AND_OLD_IMAGES)
- **Item Count**: ~50-500 (depends on guest list size)

**Global Secondary Indexes (GSIs):**

1. **InvitationCodeIndex**
   - Partition Key: `InvitationCode` (String)
   - Sort Key: `created_at` (String)
   - Projection: ALL
   - Use Case: Quick lookup of guests by invitation code

2. **EventStatusIndex**
   - Partition Key: `EventStatus` (String)
   - Sort Key: `updated_at` (String)
   - Projection: ALL
   - Use Case: Filter guests by RSVP status

3. **AdminDateIndex**
   - Partition Key: `EntityType` (String)
   - Sort Key: `AdminDate` (String)
   - Projection: INCLUDE (guest_name, updated_at, event_id, plus_ones_count, email, rsvp_status)
   - Use Case: Admin queries for reporting and analytics

**Data Models:**

**Guest Profile Item:**
```json
{
  "PK": "GUEST#dac864",                      // Partition key
  "SK": "PROFILE",                           // Sort key
  "item_type": "GUEST",                      // Entity type
  "invitation_code": "dac864",               // Unique 6-char code
  "name": "David Chen",                      // Guest full name
  "guest_name": "David Chen",                // Duplicate for GSI
  "email": "david.chen@example.com",         // Guest email
  "phone": "425-555-0502",                   // Guest phone
  "max_guests": 1,                           // Allowed party size
  "created_at": "2025-09-11T11:13:57.307Z",  // Creation timestamp
  "updated_at": "2025-09-11T11:13:57.307Z"   // Last update timestamp
}
```

**RSVP Response Item (when created):**
```json
{
  "PK": "GUEST#dac864",                      // Same guest partition
  "SK": "RSVP#2025-09-11",                   // RSVP record
  "rsvp_status": "attending",                // attending|not_attending|maybe
  "party_size": 2,                           // Actual party size
  "dietary_restrictions": ["vegetarian"],     // Dietary needs
  "plus_one_name": "Jane Doe",               // Plus one details
  "notes": "Looking forward to it!",         // Guest message
  "responded_at": "2025-09-11T12:00:00.000Z" // Response timestamp
}
```

**Access Patterns:**
- **By Invitation Code**: Query InvitationCodeIndex with code
- **By Guest Email**: Query with PK="GUEST#{code}" and SK="PROFILE"
- **By RSVP Status**: Query EventStatusIndex with status value
- **Admin Reports**: Query AdminDateIndex with EntityType and date range
- **Guest Details**: Query with PK for all items related to a guest

**Performance Characteristics:**
- **Storage**: ~12.8 KB for 55 items (current production)
- **Capacity**: On-demand scaling (12,000 RCU/4,000 WCU warm throughput)
- **Cost**: ~$0.25/month for typical wedding (500 guests)
- **Response Times**: <50ms for single item queries, <200ms for index queries
- **Availability**: Multi-AZ with point-in-time recovery available

## Lambda Functions Documentation

### AWS Account Lambda Functions (Region: us-east-1)

| Function Name                                                       | Purpose                                                                            | CloudWatch Log Group                                                          | Runtime      | Memory  | Timeout |
|---------------------------------------------------------------------|------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|--------------|---------|---------|
| **wedding-validate-invitation-production**                          | Validates guest invitation codes for RSVP access                                   | `RsvpBackendStack-ApiValidateInvitationLogsF76E078B-Xp7rsfPVx47j`             | Node.js 20.x | 256 MB  | 30s     |
| **wedding-create-rsvp-production**                                  | Creates new RSVP records when guests submit responses                              | `RsvpBackendStack-ApiCreateRSVPLogsA7B5D752-xnU1Z7nGnUrU`                     | Node.js 20.x | 256 MB  | 30s     |
| **wedding-update-rsvp-production**                                  | Updates existing RSVP records with guest changes                                   | `RsvpBackendStack-ApiUpdateRSVPLogsD7823710-5A8ydwZwTPJb`                     | Node.js 20.x | 256 MB  | 30s     |
| **wedding-get-rsvp-production**                                     | Retrieves RSVP details for a specific guest                                        | `RsvpBackendStack-ApiGetRSVPLogs5876A655-tqgwEGyfSFHz`                        | Node.js 20.x | 256 MB  | 30s     |
| **wedding-list-rsvps-production**                                   | Lists all RSVPs with filtering and pagination                                      | `RsvpBackendStack-ApiListRSVPLogs87F3C11C-LhNGZ7V7dAu0`                       | Node.js 20.x | 256 MB  | 30s     |
| **wedding-create-guest-production**                                 | Creates new guest records in the database                                          | `RsvpBackendStack-ApiCreateGuestLogsF626E0D1-gKrbIq9kr8Om`                    | Node.js 20.x | 512 MB  | 30s     |
| **wedding-batch-party-rsvp-production**                             | Handles batch RSVP submissions for entire parties/groups                           | `RsvpBackendStack-ApiBatchPartyRSVPLogsCA6636A2-tjQOCOAgJ0Rp`                 | Node.js 20.x | 512 MB  | 30s     |
| **wedding-stream-processor-production**                             | Processes DynamoDB stream events for RSVP changes and triggers email notifications | `/aws/lambda/wedding-stream-processor-production`                             | Node.js 20.x | 512 MB  | 60s     |
| **wedding-send-email-production**                                   | Sends transactional emails via SES (confirmations, reminders)                      | `RsvpBackendStack-EmailLambdasSendEmailLogsA3521483-a6gNbmU7Rygt`             | Node.js 20.x | 512 MB  | 60s     |
| **wedding-process-email-queue-production**                          | Processes queued email requests and batch sends                                    | `RsvpBackendStack-EmailLambdasProcessEmailQueueLogs7FB80DCE-BnILLzE9UY6o`     | Node.js 20.x | 1024 MB | 300s    |
| **wedding-process-bounce-production**                               | Handles SES bounce notifications and updates guest records                         | `RsvpBackendStack-EmailLambdasProcessBounceLogsF09D0EF3-guoTGaHWQ9DI`         | Node.js 20.x | 256 MB  | 60s     |
| **wedding-process-complaint-production**                            | Handles SES complaint notifications and manages suppressions                       | `RsvpBackendStack-EmailLambdasProcessComplaintLogsB87A6220-JKL9FTkreerI`      | Node.js 20.x | 256 MB  | 60s     |
| **RsvpBackendStack-AdminApiAdminAuthFunction6010FF14-Tk9VgwxAL4DY** | Handles admin authentication (login/logout)                                        | `/aws/lambda/RsvpBackendStack-AdminApiAdminAuthFunction6010FF14-Tk9VgwxAL4DY` | Node.js 20.x | 512 MB  | 30s     |
| **RsvpBackendStack-AdminApiAdminAuthorizerFunction8B-4IANa8yhy1W4** | JWT token validation for admin API endpoints                                       | `/aws/lambda/RsvpBackendStack-AdminApiAdminAuthorizerFunction8B-4IANa8yhy1W4` | Node.js 20.x | 256 MB  | 10s     |
| **RsvpBackendStack-AdminApiAdminGuestsFunctionFBBF80-LyvuiuDbmHHD** | Admin API for guest management (CRUD operations including individual guest updates via path parameters) | `/aws/lambda/RsvpBackendStack-AdminApiAdminGuestsFunctionFBBF80-LyvuiuDbmHHD` | Node.js 20.x | 512 MB  | 30s     |
| **RsvpBackendStack-AdminApiAdminStatsFunction9FB9CF3-xU8uH06Ph5hO** | Generates admin dashboard statistics and reports                                   | `/aws/lambda/RsvpBackendStack-AdminApiAdminStatsFunction9FB9CF3-xU8uH06Ph5hO` | Node.js 20.x | 512 MB  | 30s     |
| **WeddingWebsiteCdkStack-CustomS3AutoDeleteObjectsCu-rssHph0bpVzs** | CloudFormation custom resource for S3 bucket cleanup on stack deletion             | `/aws/lambda/WeddingWebsiteCdkStack-CustomS3AutoDeleteObjectsCu-rssHph0bpVzs` | Node.js 22.x | 128 MB  | 900s    |
| **RsvpBackendStack-CustomS3AutoDeleteObjectsCustomRe-kIUTjP6xOTIT** | CloudFormation custom resource for email S3 bucket cleanup                         | `/aws/lambda/RsvpBackendStack-CustomS3AutoDeleteObjectsCustomRe-kIUTjP6xOTIT` | Node.js 22.x | 128 MB  | 900s    |

### Function Categories

**Guest RSVP Functions:**
- **Validation**: `wedding-validate-invitation-production` - Entry point for guest authentication
- **CRUD Operations**: Create, Read, Update, List RSVP records
- **Batch Processing**: `wedding-batch-party-rsvp-production` for group submissions

**Email Processing Functions:**
- **Stream Processor**: Triggers on DynamoDB changes to queue emails
- **Send Email**: Direct email sending via SES
- **Queue Processor**: Batch email processing for efficiency
- **Bounce/Complaint Handling**: Maintains email deliverability

**Admin Panel Functions:**
- **Authentication**: Login/logout and JWT token management
- **Authorization**: API Gateway authorizer for protected endpoints
- **Guest Management**: Full CRUD operations on guest records including:
  - GET `/admin/guests` - List all guests with filtering
  - GET `/admin/guests/{invitationCode}` - Get single guest details
  - PUT `/admin/guests/{invitationCode}` - Update single guest
  - DELETE `/admin/guests/{invitationCode}` - Delete single guest
- **Statistics**: Dashboard metrics and reporting

**Infrastructure Functions:**
- **S3 Cleanup**: CloudFormation custom resources for bucket deletion

### Lambda Layer Dependencies

**Admin Common Layer** (`layers/admin-common/nodejs/`):
- `jsonwebtoken`: JWT token handling
- `bcryptjs`: Password hashing
- `zod`: Schema validation for admin operations

### Lambda Environment Variables

**Common Variables:**
- `TABLE_NAME`: `wedding-rsvp-production` (Main DynamoDB table)
- `CORS_ORIGIN`: `*` (Allow all origins)
- `STAGE`/`ENVIRONMENT`: `production`
- `LOG_LEVEL`: `INFO` or `DEBUG`

**Email Configuration:**
- `SOURCE_EMAIL`: `espoused@wedding.himnher.dev`
- `WEBSITE_URL`: `https://wedding.himnher.dev`
- `CONFIGURATION_SET`: `wedding-rsvp-production`
- `SES_SANDBOX_MODE`: `true`

**Admin Configuration:**
- `ADMIN_TABLE_NAME`: `WeddingAdmins`
- `JWT_PRIVATE_KEY_PARAM`: `/wedding-rsvp/production/jwt/private-key`
- `JWT_PUBLIC_KEY_PARAM`: `/wedding-rsvp/production/jwt/public-key`

### Log Group Naming Patterns

1. **API Functions**: `RsvpBackendStack-Api{FunctionName}Logs{Hash}`
2. **Email Functions**: `RsvpBackendStack-EmailLambdas{FunctionName}Logs{Hash}`
3. **Admin Functions**: `/aws/lambda/RsvpBackendStack-AdminApi{FunctionName}`
4. **Stream Processor**: `/aws/lambda/wedding-stream-processor-production`
5. **Custom Resources**: `/aws/lambda/{StackName}-CustomS3AutoDeleteObjects{Hash}`

### Key Lambda Integration Points

1. **DynamoDB Streams** → `wedding-stream-processor-production` → Email Queue
2. **API Gateway** → RSVP Lambda Functions → DynamoDB
3. **Admin API Gateway** → Authorizer → Admin Functions → DynamoDB
4. **SES Events** → SNS → Bounce/Complaint Processors
5. **CloudFormation** → Custom Resources → S3 Bucket Management

### Lambda Performance Characteristics

- **API Functions**: 256-512 MB memory, 30s timeout
- **Email Processor**: 1024 MB memory, 300s timeout (batch processing)
- **Stream Processor**: 512 MB memory, 60s timeout
- **Admin Functions**: 512 MB memory, 30s timeout
- **Authorizer**: 256 MB memory, 10s timeout (fast validation)
- **Custom Resources**: 128 MB memory, 900s timeout (cleanup operations)

### Lambda Monitoring Recommendations

**Critical Functions to Monitor:**
- `wedding-validate-invitation-production` (Guest entry point)
- `wedding-stream-processor-production` (Email trigger)
- `AdminAuthorizerFunction` (Admin access control)

**Key Metrics:**
- Error rates and 4xx/5xx responses
- Duration and timeout occurrences
- Concurrent executions
- DLQ messages (if configured)

**Alarm Thresholds:**
- Error rate > 1% for API functions
- Duration > 5s for validation/auth functions
- Email queue depth > 100 messages
- Bounce rate > 5% for email sending

## Essential Testing Commands

**Infrastructure Validation:**
```bash
# CORS functionality (CRITICAL - run after every deployment)
just test-cors

# Full deployment validation
just test-deployment

# Admin access verification
just test-admin-login

# Email system validation
just test-email-flow

# Guest data integrity
just validate-guests
```

## Development Validation Checklist

**Before considering any task complete:**

- [ ] **CORS Verification**: Run `just test-cors` to ensure API calls work
- [ ] **Admin Access**: Test admin panel login at `/admin/login`
- [ ] **Email Functionality**: Verify email notifications if email-related changes made
- [ ] **Guest Import/Export**: Validate guest data operations if schema changes made
- [ ] **Playwright Validation**: Use Playwright MCP for frontend testing (per existing requirement)
- [ ] **Mobile Responsiveness**: Test on mobile devices for UI changes
- [ ] **Database Integrity**: Check DynamoDB tables and indexes if backend changes made

## Infrastructure Dependencies

**Key AWS Services & Configuration:**
- **Domain**: `wedding.himnher.dev` (Route53)
- **API Domain**: `api.wedding.himnher.dev` (may require fallback to direct Gateway URLs)
- **DynamoDB Tables**: `WeddingGuests`, `WeddingAdmins`, `WeddingEvents`
- **SES Verified Senders**: `espoused@wedding.himnher.dev`
- **WorkMail Organization**: `goaing-to-the-chapel` (optional)
- **CloudFront Distributions**: Frontend delivery and custom domain routing

**Environment Configuration:**
- **Region**: `us-east-1` (required for SES, Route53)
- **CDK Stacks**: `WeddingWebsiteCdkStack` (frontend), `RsvpBackendStack` (API)
- **API Endpoints**: Main API and separate Admin API with different base paths

## Common Issues & Troubleshooting

**1. CORS 403 Errors:**
- **Cause**: Custom domain CloudFront routing blocks OPTIONS requests
- **Solution**: Use direct API Gateway URLs in `frontend/public/config.json`
- **Test**: Always run `just test-cors` after deployment

**2. Admin Login Failures:**
- **Cause**: No admin user created or JWT keys missing
- **Solution**: Run `node scripts/create-admin-user.js`
- **Verify**: Check `WeddingAdmins` table in DynamoDB console

**3. Email Send Failures:**
- **Cause**: Sender email not verified in SES
- **Solution**: Verify `espoused@wedding.himnher.dev` in SES console
- **WorkMail**: Create user in WorkMail organization if using full email hosting

**4. Guest Import Errors:**
- **Cause**: CSV format issues or duplicate emails
- **Solution**: Use `--dry-run` flag to validate format before import
- **Format**: Ensure all required fields present and emails unique

**5. Custom Domain Issues:**
- **Cause**: CloudFront distribution blocking API requests
- **Solution**: Update config to use direct API Gateway URLs
- **Fallback**: `https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/`

**6. DynamoDB Undefined Values Error (500):**
- **Cause**: DynamoDBDocumentClient not configured to handle undefined values
- **Solution**: Add `marshallOptions: { removeUndefinedValues: true }` to DynamoDBDocumentClient.from()
- **Files**: Update all Lambda functions using DynamoDB (admin-guests.ts, admin-stats.ts, etc.)
- **Test**: Verify guest edit/save functionality in admin panel works without errors

## Justfile Commands Reference

**Setup & Deployment:**
```bash
just setup-admin           # Create admin user interactively
just import-guests         # Import guest list from CSV
just deploy               # Full deployment (frontend + backend)
```

**Testing & Validation:**
```bash
just test-cors            # Test CORS configuration
just test-deployment      # Verify full stack
just test-admin-login     # Check admin panel access
just test-email-flow      # Validate email system
just validate-guests      # Check guest data integrity
```

**Troubleshooting:**
```bash
just update-cors          # Apply CORS fixes
just check-admin          # Verify admin user exists
just reset-admin          # Reset admin password
```

This project requires careful attention to post-deployment setup steps that are unique to wedding/event management systems. The CORS configuration, admin user creation, and guest list import are critical steps that are often overlooked but essential for a functional system.
