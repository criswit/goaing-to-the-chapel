## WEDDING WEBSITE

### Guest List Import Guide

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
