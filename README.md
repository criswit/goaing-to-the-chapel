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

1. **Deploy Infrastructure**: `npm run build && npx cdk deploy RsvpBackendStack --profile wedding-website`
2. **Create Admin User**: `node scripts/create-admin-user.js`
3. **Import Guest List**: `node scripts/import-guests.js your-guests.csv --dry-run` (test first)
4. **Import Guests**: `node scripts/import-guests.js your-guests.csv`
5. **Test System**: `just test-cors` and visit `https://wedding.himnher.dev/admin/login`

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
> 🎯 **Taskmaster Export** - 2025-09-11 15:58:15 UTC
> 📋 Export: without subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=goaing-to-the-chapel&utm_content=task-export-link)

| Project Dashboard |  |
| :-                |:-|
| Task Progress     | ████████████░░░░░░░░ 60% |
| Done | 9 |
| In Progress | 1 |
| Pending | 5 |
| Deferred | 0 |
| Cancelled | 0 |
|-|-|
| Subtask Progress | ██████████████░░░░░░ 69% |
| Completed | 46 |
| In Progress | 0 |
| Pending | 21 |


| ID | Title | Status | Priority | Dependencies | Complexity |
| :- | :-    | :-     | :-       | :-           | :-         |
| 1 | Setup Backend Infrastructure with AWS CDK | ✓&nbsp;done | high | None | N/A |
| 2 | Design DynamoDB Data Model and Access Patterns | ✓&nbsp;done | high | 1 | N/A |
| 3 | Implement Guest Lookup and Authentication System | ✓&nbsp;done | high | 2 | N/A |
| 4 | Create Core RSVP API Endpoints | ✓&nbsp;done | high | 3 | N/A |
| 5 | Build Multi-Step RSVP Form Frontend | ✓&nbsp;done | high | 4 | N/A |
| 6 | Implement Plus-One and Party Management | ✓&nbsp;done | medium | 5 | N/A |
| 7 | Setup Email Confirmation System with AWS SES | ✓&nbsp;done | medium | 4 | N/A |
| 8 | Create Admin Dashboard for Guest Management | ○&nbsp;pending | medium | 6, 7 | N/A |
| 9 | Add Event-Specific RSVP Options | ►&nbsp;in-progress | medium | 5 | N/A |
| 10 | Implement Data Export and Vendor Integration | ○&nbsp;pending | medium | 8 | N/A |
| 11 | Add Advanced Security and Performance Features | ○&nbsp;pending | high | 9, 10 | N/A |
| 12 | Implement Mobile Optimization and PWA Features | ○&nbsp;pending | medium | 11 | N/A |
| 13 | Fix admin dashboard data counting and display issues | ✓&nbsp;done | high | 2, 8 | N/A |
| 14 | Fix admin dashboard RSVP status mapping | ✓&nbsp;done | high | None | N/A |
| 15 | Implement Backend API Endpoint for Updating Guest Information | ○&nbsp;pending | high | 1, 2, 4, 8 | N/A |

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->
