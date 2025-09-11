# GOA Wedding Website 

A full-stack wedding website and RSVP management system built with React, TypeScript, and AWS CDK. This system provides a complete solution for managing wedding invitations, guest responses, and event coordination.

## Overview

This wedding website system consists of two main components:

### Frontend (React + TypeScript)
- **Wedding Website**: A beautiful, responsive website hosted on CloudFront at `wedding.himnher.dev`
- **Multi-page Navigation**: Home, Travel, Stay, Events, Attire, Registry, FAQ, and RSVP pages
- **Guest RSVP Interface**: Secure invitation code-based RSVP system for guests
- **Admin Dashboard**: JWT-protected admin panel at `/admin/login` for guest management

### Backend (AWS Serverless)
- **API Gateway**: RESTful APIs for guest RSVP operations and admin management
- **DynamoDB**: Single-table design for guest data, RSVP responses, and admin users
- **Lambda Functions**: Serverless functions for RSVP processing, email notifications, and admin operations
- **SES Integration**: Automated email confirmations, reminders, and notifications
- **Custom Domain**: API accessible at `api.wedding.himnher.dev`

## Key Features

- **Invitation Code System**: Auto-generated 6-character codes for secure guest access
- **Group Management**: Handle families and couples with designated primary contacts
- **Email Automation**: Automated confirmations, updates, and reminders via AWS SES
- **Admin Dashboard**: Complete guest management with statistics, bulk operations, and data export
- **CSV Import/Export**: Easy guest list management with validation and reporting
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Security**: JWT-based authentication and secure invitation code validation

## Quick Start

### First-Time Setup
1. **Initialize JWT Keys**: `npm run init:jwt-keys` (one-time setup)
2. **Deploy Infrastructure**: `npm run deploy:backend`
3. **Create Admin User**: `node scripts/create-admin-user.js`
4. **Import Guest List**: `node scripts/import-guests.js your-guests.csv --dry-run` (test first)
5. **Import Guests**: `node scripts/import-guests.js your-guests.csv`
6. **Test System**: `just test-cors` and visit `https://wedding.himnher.dev/admin/login`

### Subsequent Deployments
```bash
npm run deploy:backend  # Keys are preserved across deployments
```

## JWT Key Management

### Overview
JWT keys for admin authentication are managed separately from CDK deployments to prevent accidental regeneration. Keys are stored in AWS Systems Manager Parameter Store and persist across deployments.

### Key Initialization (First-Time Setup)
```bash
# Initialize keys before first deployment
npm run init:jwt-keys

# Or manually specify environment
node scripts/init-jwt-keys.js production
```

The initialization script:
- Checks if keys already exist in SSM Parameter Store
- Only generates new keys if they don't exist
- Stores keys at:
  - `/wedding-rsvp/production/jwt/private-key` (SecureString)
  - `/wedding-rsvp/production/jwt/public-key` (String)

### Key Rotation
When you need to rotate keys (e.g., for security or compliance):

```bash
# Option 1: Full rotation with Lambda refresh
npm run rotate:jwt-keys

# Option 2: Force regeneration only
npm run rotate:jwt-keys:force

# Option 3: Manual rotation with confirmation
node scripts/init-jwt-keys.js production
# Answer "yes" when prompted to regenerate
```

**Important**: Key rotation will:
- Invalidate all existing admin sessions
- Require all admin users to log in again
- Automatically refresh Lambda functions to use new keys

### CDK Integration
The CDK stack uses `AuthInfrastructureSimple` which:
- References existing SSM parameters (doesn't create them)
- Grants Lambda functions read access to the keys
- Preserves keys across deployments

```typescript
// lib/backend/auth-infrastructure-simple.ts
this.jwtPrivateKeyParameter = ssm.StringParameter.fromStringParameterName(
  this, 'JWTPrivateKey', '/wedding-rsvp/production/jwt/private-key'
);
```

### Troubleshooting

**Issue: "Invalid signature" errors after deployment**
- Cause: CDK previously regenerated keys on each deployment
- Solution: Run `npm run init:jwt-keys` to set stable keys

**Issue: Admin login fails after key rotation**
- Expected behavior - all sessions are invalidated
- Solution: Log in again with admin credentials

**Issue: Lambda functions using old keys**
- Solution: Force Lambda refresh:
```bash
./scripts/rotate-jwt-keys.sh production
```

### Available NPM Scripts
```json
"init:jwt-keys": "Initialize JWT keys (first-time setup)",
"rotate:jwt-keys": "Rotate keys with Lambda refresh",
"rotate:jwt-keys:force": "Force key regeneration",
"deploy:first-time": "Initialize keys + deploy",
"deploy:backend": "Regular deployment (preserves keys)"
```

## Guest List Import Guide

#### Overview
This guide explains how to import your wedding guest list into the RSVP system database.

#### Quick Start

##### 1. Prepare Your Guest List CSV

Create a CSV file with your guest information using this format:

```csv
name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact,tableNumber,dietaryRestrictions,notes
John Smith,john.smith@email.com,+1-555-0001,1,Smith Family,smith-family,true,1,Vegetarian,College friend
Sarah Smith,sarah.smith@email.com,+1-555-0002,0,Smith Family,smith-family,false,1,,John's wife
```

**Field Descriptions:**
- `name` (required): Full name of the guest
- `email` (required): Email address (will be used for login)
- `phone` (optional): Phone number with country code
- `plusOnesAllowed` (required): Number of additional guests they can bring (0 for none)
- `groupName` (optional): Family/group name for related guests
- `groupId` (optional): Unique identifier for the group (use lowercase with hyphens)
- `isPrimaryContact` (optional): Set to "true" for the main contact in each group
- `tableNumber` (optional): Assigned table number for reception
- `dietaryRestrictions` (optional): Comma-separated list (e.g., "Vegetarian,Nut-Free")
- `notes` (optional): Any additional notes about the guest

##### 2. Test Your Import (Dry Run)

Before importing to the database, test your CSV file:

```bash
node scripts/import-guests.js your-guests.csv --dry-run
```

This will:
- Validate your CSV format
- Generate invitation codes
- Show what will be imported
- NOT write to the database

##### 3. Import Your Guests

Once you're satisfied with the dry run:

```bash
node scripts/import-guests.js your-guests.csv
```

##### 4. Generate Invitation Codes Report

To get a CSV report of all invitation codes:

```bash
node scripts/import-guests.js your-guests.csv --generate-report
```

This creates `invitation-codes.csv` with:
- Guest name
- Email
- Invitation code

### Invitation Code Format

The system generates unique 6-character invitation codes:
- First 2 letters of first name
- First letter of last name  
- 3 random numbers
- Example: John Smith → JOS123

### Working with Groups

Groups are useful for families or couples who should be managed together:

```csv
name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact
John Doe,john@email.com,+1-555-0001,1,Doe Family,doe-family,true
Jane Doe,jane@email.com,+1-555-0002,0,Doe Family,doe-family,false
Baby Doe,baby@email.com,,0,Doe Family,doe-family,false
```

**Benefits of groups:**
- Track related guests together
- Designate a primary contact
- Manage group RSVPs
- Assign to same table

### Sample Files

- **Template**: `data/guest-list-template.csv` - Empty template with headers
- **Example**: `data/sample-guests.csv` - Sample data showing various scenarios

### Important Notes

1. **Email addresses must be unique** - Each guest needs their own email
2. **Invitation codes are auto-generated** - Don't include them in your CSV
3. **Groups are optional** - Single guests don't need group info
4. **Test first** - Always do a dry run before actual import
5. **Keep a backup** - Save your CSV file and invitation codes report

### Updating Existing Guests

To update guests after initial import:
1. Re-run the import with updated CSV
2. Existing guests with same email will be updated
3. New guests will be added

### Troubleshooting

**CSV parsing errors:**
- Check for proper comma separation
- Ensure no extra commas in fields
- Use quotes for fields containing commas

**Import fails:**
- Verify AWS credentials are configured
- Check internet connection
- Ensure DynamoDB table exists

**Duplicate invitation codes:**
- Very rare with name-based generation
- System will auto-generate unique alternative

### Next Steps

After importing your guests:

1. **Send invitation codes** to guests via email/invitation cards
2. **Test the RSVP flow** with a sample invitation code
3. **Monitor RSVPs** through the database
4. **Export RSVP data** for planning purposes

### Support

For issues or questions:
- Check the error messages in console
- Review the sample CSV file
- Run with `--debug` flag for detailed errors

<!-- TASKMASTER_EXPORT_START -->
> 🎯 **Taskmaster Export** - 2025-09-11 19:43:15 UTC
> 📋 Export: with subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=goaing-to-the-chapel&utm_content=task-export-link)

| Project Dashboard |  |
| :-                |:-|
| Task Progress     | █████████████░░░░░░░ 63% |
| Done | 10 |
| In Progress | 1 |
| Pending | 5 |
| Deferred | 0 |
| Cancelled | 0 |
|-|-|
| Subtask Progress | ███████████████░░░░░ 74% |
| Completed | 61 |
| In Progress | 0 |
| Pending | 21 |


| ID | Title | Status | Priority | Dependencies | Complexity |
| :- | :-    | :-     | :-       | :-           | :-         |
| 1 | Setup Backend Infrastructure with AWS CDK | ✓&nbsp;done | high | None | N/A |
| 1.1 | Create new CDK stack for backend services | ✓&nbsp;done | -            | None | N/A |
| 1.2 | Set up DynamoDB table with single-table design | ✓&nbsp;done | -            | 1.1 | N/A |
| 1.3 | Create API Gateway with CORS configuration | ✓&nbsp;done | -            | 1.1 | N/A |
| 1.4 | Implement base Lambda function structure | ✓&nbsp;done | -            | 1.2, 1.3 | N/A |
| 1.5 | Configure IAM roles and policies for service integration | ✓&nbsp;done | -            | 1.4 | N/A |
| 2 | Design DynamoDB Data Model and Access Patterns | ✓&nbsp;done | high | 1 | N/A |
| 2.1 | Define Entity Relationships and Composite Key Structure | ✓&nbsp;done | -            | None | N/A |
| 2.2 | Design Global Secondary Indexes for Access Patterns | ✓&nbsp;done | -            | 2.1 | N/A |
| 2.3 | Create Data Validation Schemas and Naming Conventions | ✓&nbsp;done | -            | 2.2 | N/A |
| 2.4 | Document Access Patterns and Query Efficiency Requirements | ✓&nbsp;done | -            | 2.3 | N/A |
| 3 | Implement Guest Lookup and Authentication System | ✓&nbsp;done | high | 2 | N/A |
| 3.1 | Create Lambda function for invitation code validation | ✓&nbsp;done | -            | None | N/A |
| 3.2 | Implement JWT token generation with RS256 algorithm | ✓&nbsp;done | -            | 3.1 | N/A |
| 3.3 | Configure AWS Systems Manager Parameter Store for key management | ✓&nbsp;done | -            | None | N/A |
| 3.4 | Create authentication middleware for API protection | ✓&nbsp;done | -            | 3.2, 3.3 | N/A |
| 3.5 | Implement comprehensive error handling and security measures | ✓&nbsp;done | -            | 3.1, 3.2, 3.4 | N/A |
| 4 | Create Core RSVP API Endpoints | ✓&nbsp;done | high | 3 | N/A |
| 4.1 | Implement GET /api/rsvp/{invitationCode} endpoint | ✓&nbsp;done | -            | None | N/A |
| 4.2 | Create POST /api/rsvp endpoint for RSVP submission | ✓&nbsp;done | -            | 4.1 | N/A |
| 4.3 | Add GET /api/rsvp/{invitationCode}/status endpoint | ✓&nbsp;done | -            | 4.2 | N/A |
| 4.4 | Implement request validation, error handling, and rate limiting | ✓&nbsp;done | -            | 4.3 | N/A |
| 5 | Build Multi-Step RSVP Form Frontend | ✓&nbsp;done | high | 4 | N/A |
| 5.1 | Install and configure React Hook Form and Zod dependencies | ✓&nbsp;done | -            | None | N/A |
| 5.2 | Build step 1: Guest lookup with invitation code | ✓&nbsp;done | -            | 5.1 | N/A |
| 5.3 | Build step 2: Personal information and attendance confirmation | ✓&nbsp;done | -            | 5.2 | N/A |
| 5.4 | Build step 3: Dietary restrictions and special requests | ✓&nbsp;done | -            | 5.3 | N/A |
| 5.5 | Build step 4: Review and submission interface | ✓&nbsp;done | -            | 5.4 | N/A |
| 5.6 | Implement progress indicator, validation, and localStorage persistence | ✓&nbsp;done | -            | 5.5 | N/A |
| 6 | Implement Plus-One and Party Management | ✓&nbsp;done | medium | 5 | N/A |
| 6.1 | Update DynamoDB Schema for Plus-One Support | ✓&nbsp;done | -            | None | N/A |
| 6.2 | Modify API Endpoints for Batch Party Operations | ✓&nbsp;done | -            | 6.1 | N/A |
| 6.3 | Create Dynamic Plus-One Form Fields | ✓&nbsp;done | -            | 6.1 | N/A |
| 6.4 | Implement Party Summary and Validation Logic | ✓&nbsp;done | -            | 6.2, 6.3 | N/A |
| 6.5 | Update DynamoDB Schema for Plus-One Support | ✓&nbsp;done | -            | None | N/A |
| 6.6 | Create Dynamic Plus-One Form Fields Component | ✓&nbsp;done | -            | 6.1 | N/A |
| 6.7 | Implement Batch Party RSVP API Endpoints | ✓&nbsp;done | -            | 6.1 | N/A |
| 6.8 | Build Party Summary and Validation Logic | ✓&nbsp;done | -            | 6.2, 6.3 | N/A |
| 7 | Setup Email Confirmation System with AWS SES | ✓&nbsp;done | medium | 4 | N/A |
| 7.1 | Configure AWS SES in CDK with Domain Verification and DKIM | ✓&nbsp;done | -            | None | N/A |
| 7.2 | Create HTML and Text Email Templates | ✓&nbsp;done | -            | 7.1 | N/A |
| 7.3 | Build Lambda Function for Email Sending with SES v3 SDK | ✓&nbsp;done | -            | 7.2 | N/A |
| 7.4 | Setup SNS Topics and SQS Queues for Bounce and Complaint Handling | ✓&nbsp;done | -            | 7.3 | N/A |
| 7.5 | Implement Email Queue Processing with Retry Logic | ✓&nbsp;done | -            | 7.4 | N/A |
| 8 | Create Admin Dashboard for Guest Management | ○&nbsp;pending | medium | 6, 7 | N/A |
| 8.1 | Implement Admin Authentication System | ✓&nbsp;done | -            | None | N/A |
| 8.2 | Create Dashboard Layout and Navigation | ✓&nbsp;done | -            | 8.1 | N/A |
| 8.3 | Build Real-time RSVP Statistics Dashboard | ✓&nbsp;done | -            | 8.2 | N/A |
| 8.4 | Implement Guest List Management Interface | ✓&nbsp;done | -            | 8.2 | N/A |
| 8.5 | Create Bulk Operations and Reminder System | ○&nbsp;pending | -            | 8.4 | N/A |
| 8.6 | Implement Data Export Functionality | ○&nbsp;pending | -            | 8.4 | N/A |
| 9 | Add Event-Specific RSVP Options | ►&nbsp;in-progress | medium | 5 | N/A |
| 9.1 | Extend DynamoDB Schema for Multi-Event Support | ○&nbsp;pending | -            | None | N/A |
| 9.2 | Update API Endpoints for Multi-Event Processing | ○&nbsp;pending | -            | 9.1 | N/A |
| 9.3 | Implement Multi-Event Frontend Form Logic | ○&nbsp;pending | -            | 9.2 | N/A |
| 9.4 | Add Conditional Event-Specific Questions | ○&nbsp;pending | -            | 9.3 | N/A |
| 10 | Implement Data Export and Vendor Integration | ○&nbsp;pending | medium | 8 | N/A |
| 10.1 | Build Lambda Functions for Vendor-Specific Data Export Generation | ○&nbsp;pending | -            | None | N/A |
| 10.2 | Implement Multi-Format Export Support with Customizable Templates | ○&nbsp;pending | -            | 10.1 | N/A |
| 10.3 | Set Up Scheduled Export Delivery via SES | ○&nbsp;pending | -            | 10.2 | N/A |
| 10.4 | Create Admin Interface for Export Template Configuration and Scheduling | ○&nbsp;pending | -            | 10.3 | N/A |
| 11 | Add Advanced Security and Performance Features | ○&nbsp;pending | high | 9, 10 | N/A |
| 11.1 | Configure API Gateway Rate Limiting and Throttling | ○&nbsp;pending | -            | None | N/A |
| 11.2 | Implement Comprehensive Input Validation and Sanitization | ○&nbsp;pending | -            | None | N/A |
| 11.3 | Set Up Audit Logging System | ○&nbsp;pending | -            | None | N/A |
| 11.4 | Configure HTTPS Enforcement and Security Headers | ○&nbsp;pending | -            | None | N/A |
| 11.5 | Implement Data Encryption and Key Management | ○&nbsp;pending | -            | None | N/A |
| 11.6 | Configure Performance Optimizations and Scaling | ○&nbsp;pending | -            | 11.1 | N/A |
| 12 | Implement Mobile Optimization and PWA Features | ○&nbsp;pending | medium | 11 | N/A |
| 12.1 | Implement PWA Manifest and Service Worker Setup | ○&nbsp;pending | -            | None | N/A |
| 12.2 | Implement IndexedDB for Offline Data Persistence | ○&nbsp;pending | -            | 12.1 | N/A |
| 12.3 | Optimize Mobile Touch Interactions and Navigation | ○&nbsp;pending | -            | None | N/A |
| 12.4 | Implement Mobile-Specific Validation and API Optimization | ○&nbsp;pending | -            | 12.2 | N/A |
| 12.5 | Ensure WCAG 2.1 AA Accessibility Compliance | ○&nbsp;pending | -            | 12.3, 12.4 | N/A |
| 13 | Fix admin dashboard data counting and display issues | ✓&nbsp;done | high | 2, 8 | N/A |
| 13.1 | Add EntityType filtering to DynamoDB scan operations in Lambda functions | ✓&nbsp;done | -            | None | N/A |
| 13.2 | Implement RSVP deduplication logic to handle multiple responses per guest | ✓&nbsp;done | -            | 13.1 | N/A |
| 13.3 | Fix date formatting and validation in React components | ✓&nbsp;done | -            | None | N/A |
| 13.4 | Fix React key warnings by adding proper key props to list components | ✓&nbsp;done | -            | None | N/A |
| 13.5 | Improve guest name fallback logic and data merging in admin-guests.ts | ✓&nbsp;done | -            | 13.1 | N/A |
| 14 | Fix admin dashboard RSVP status mapping | ✓&nbsp;done | high | None | N/A |
| 15 | Implement Backend API Endpoint for Updating Guest Information | ○&nbsp;pending | high | 1, 2, 4, 8 | N/A |
| 15.1 | Add Path Parameter Route Configuration to CDK | ✓&nbsp;done | -            | None | N/A |
| 15.2 | Implement Path Parameter Extraction and Validation | ✓&nbsp;done | -            | 15.1 | N/A |
| 15.3 | Create Comprehensive Guest Update Zod Schema | ✓&nbsp;done | -            | 15.2 | N/A |
| 15.4 | Implement Single-Table DynamoDB Update Operations | ✓&nbsp;done | -            | 15.3 | N/A |
| 15.5 | Add Comprehensive Error Handling and Audit Logging | ✓&nbsp;done | -            | 15.4 | N/A |
| 16 | Re-enable JWT authorizer for admin dashboard API endpoints | ✓&nbsp;done | high | 8, 15 | N/A |
| 16.1 | Audit and document current authorization code structure in admin-api.ts | ✓&nbsp;done | -            | None | N/A |
| 16.2 | Validate JWT authorizer function configuration and dependencies | ✓&nbsp;done | -            | 16.1 | N/A |
| 16.3 | Uncomment TokenAuthorizer instantiation in admin-api.ts | ✓&nbsp;done | -            | 16.2 | N/A |
| 16.4 | Re-enable authorizer for admin stats endpoint | ✓&nbsp;done | -            | 16.3 | N/A |
| 16.5 | Re-enable authorizer for admin guests list endpoints | ✓&nbsp;done | -            | 16.3 | N/A |
| 16.6 | Re-enable authorizer for guest detail endpoints | ✓&nbsp;done | -            | 16.3 | N/A |
| 16.7 | Implement comprehensive error handling for authorization failures | ✓&nbsp;done | -            | 16.4, 16.5, 16.6 | N/A |
| 16.8 | Apply JWT authentication best practices from research findings | ✓&nbsp;done | -            | 16.7 | N/A |
| 16.9 | Deploy and verify TokenAuthorizer creation in AWS | ✓&nbsp;done | -            | 16.8 | N/A |
| 16.10 | Execute comprehensive authorization testing | ✓&nbsp;done | -            | 16.9 | N/A |

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->






