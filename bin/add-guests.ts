#!/usr/bin/env ts-node

/**
 * Guest List Import Script for Wedding RSVP System
 *
 * This script imports guest data from a CSV file into DynamoDB.
 * It generates unique invitation codes and sets up all necessary fields.
 *
 * CSV Format Expected:
 * name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact
 *
 * Example:
 * John Doe,john.doe@example.com,+1-555-0123,2,Doe Family,doe-family,true
 * Jane Doe,jane.doe@example.com,+1-555-0124,0,Doe Family,doe-family,false
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';
import { fromIni } from '@aws-sdk/credential-provider-ini';

// Types
interface GuestCSVRecord {
  name: string;
  email: string;
  phone?: string;
  plusOnesAllowed?: string;
  groupName?: string;
  groupId?: string;
  isPrimaryContact?: string | boolean;
}

interface GuestItem {
  PK: string;
  SK: string;
  item_type: 'GUEST';
  guest_name: string;
  name: string; // Added for compatibility
  email: string;
  phone: string;
  invitation_code: string;
  max_guests: number;
  created_at: string;
  updated_at: string;
}

type DynamoDBItem = GuestItem;

interface ImportOptions {
  dryRun?: boolean;
  generateReport?: boolean;
  debug?: boolean;
}

// Configuration
const TABLE_NAME = 'wedding-rsvp-production';
const REGION = 'us-east-1';
const PROFILE = 'wedding-website';
const EVENT_ID = 'aakanchha-christopher-2026';

// Debug logging helper
function debugLog(message: string, options?: ImportOptions) {
  if (options && options.debug) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`);
  }
}

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: fromIni({ profile: PROFILE }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper functions removed - using simplified composite key structure

/**
 * Generate a unique invitation code
 * Format: 3 letters + 3 numbers (e.g., ABC123)
 */
function generateInvitationCode(existingCodes: Set<string> = new Set()): string {
  let code: string;
  do {
    const letters = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 3);
    const numbers = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    code = letters + numbers;
  } while (existingCodes.has(code));

  existingCodes.add(code);
  return code;
}

/**
 * Generate invitation code based on name
 * Uses first 2 letters of first name + first letter of last name + 3 random numbers
 */
function generateNameBasedCode(name: string, existingCodes: Set<string> = new Set()): string {
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';

  let prefix = '';
  if (firstName.length >= 2) {
    prefix = firstName.substring(0, 2).toUpperCase();
  } else {
    prefix = firstName.toUpperCase().padEnd(2, 'X');
  }

  if (lastName) {
    prefix += lastName.substring(0, 1).toUpperCase();
  } else {
    prefix += 'X';
  }

  let code: string;
  let attempts = 0;
  do {
    const numbers = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    code = prefix + numbers;
    attempts++;

    // Fallback to random code if we can't generate a unique name-based one
    if (attempts > 10) {
      return generateInvitationCode(existingCodes);
    }
  } while (existingCodes.has(code));

  existingCodes.add(code);
  return code;
}

/**
 * Process CSV file and prepare guest data
 * Only allows: name, email, phone, plusOnesAllowed, groupName, groupId, isPrimaryContact
 */
function processCSV(csvPath: string, options?: ImportOptions): GuestCSVRecord[] {
  debugLog(`Reading CSV file from: ${csvPath}`, options);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  // Only allow the permitted keys
  const allowedKeys = [
    'name',
    'email',
    'phone',
    'plusOnesAllowed',
    'groupName',
    'groupId',
    'isPrimaryContact',
  ];

  const guests: GuestCSVRecord[] = records.map((row, idx) => {
    const filtered: GuestCSVRecord = {} as GuestCSVRecord;
    for (const key of allowedKeys) {
      if (row[key] !== undefined) {
        (filtered as unknown as Record<string, unknown>)[key] = row[key];
      }
    }
    // Type conversion for isPrimaryContact
    if (filtered.isPrimaryContact !== undefined) {
      if (filtered.isPrimaryContact === true || filtered.isPrimaryContact === false) {
        // already boolean
      } else if (typeof filtered.isPrimaryContact === 'string') {
        filtered.isPrimaryContact = filtered.isPrimaryContact.trim().toLowerCase() === 'true';
      }
    }
    // Type conversion for plusOnesAllowed
    if (filtered.plusOnesAllowed !== undefined) {
      filtered.plusOnesAllowed = filtered.plusOnesAllowed.trim();
    }
    debugLog(`Parsed guest row ${idx + 1}: ${JSON.stringify(filtered)}`, options);
    return filtered;
  });

  // Check for extra columns
  for (const [idx, row] of records.entries()) {
    const extraKeys = Object.keys(row).filter((k) => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      debugLog(`Row ${idx + 1} contains unsupported columns: ${extraKeys.join(', ')}`, options);
    }
  }

  return guests;
}

/**
 * Helper to safely parse plusOnesAllowed to a valid integer >= 0.
 * Returns 0 if value is missing, empty, not a number, or negative.
 */
function safeParsePlusOnesAllowed(value: string | undefined): number {
  if (value === undefined || value === null) return 0;
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const num = Number(trimmed);
  if (isNaN(num) || !isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

/**
 * Create guest items for DynamoDB
 */
function createGuestItems(
  guests: GuestCSVRecord[],
  existingCodes: Set<string> = new Set(),
  options?: ImportOptions
): DynamoDBItem[] {
  const timestamp = new Date().toISOString();
  const items: DynamoDBItem[] = [];
  const groups = new Map<string, GuestCSVRecord[]>();

  debugLog(`Organizing guests into groups`, options);

  // First pass: organize by groups
  guests.forEach((guest) => {
    if (guest.groupId) {
      if (!groups.has(guest.groupId)) {
        groups.set(guest.groupId, []);
      }
      groups.get(guest.groupId)!.push(guest);
    }
  });

  debugLog(`Creating guest items`, options);

  // Second pass: create guest items with new composite key structure
  guests.forEach((guest) => {
    const email = guest.email.toLowerCase().trim();
    const invitationCode = generateNameBasedCode(guest.name, existingCodes).toLowerCase();

    // Use safeParsePlusOnesAllowed to ensure valid number
    const plusOnesCount = safeParsePlusOnesAllowed(guest.plusOnesAllowed);

    const guestItem: GuestItem = {
      // New composite key structure: PK is GUEST#code, SK is PROFILE
      PK: `GUEST#${invitationCode}`,
      SK: 'PROFILE',
      item_type: 'GUEST',

      // Core guest information
      guest_name: guest.name,
      name: guest.name, // Added for compatibility
      email: email,
      phone: guest.phone || '',
      invitation_code: invitationCode,
      max_guests: plusOnesCount + 1, // Total including the guest themselves

      // Metadata
      created_at: timestamp,
      updated_at: timestamp,
    };

    debugLog(
      `Created GuestItem for ${guestItem.guest_name} (${guestItem.email}): ${JSON.stringify(
        guestItem
      )}`,
      options
    );

    items.push(guestItem);
  });

  // Groups are no longer created as separate items in the new structure

  return items;
}

/**
 * Batch write items to DynamoDB
 */
async function batchWriteToDynamoDB(items: DynamoDBItem[], options?: ImportOptions): Promise<void> {
  const batches: DynamoDBItem[][] = [];

  // DynamoDB BatchWrite supports max 25 items per request
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  debugLog(`Prepared ${batches.length} batch(es) for DynamoDB write`, options);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchParams: BatchWriteCommandInput = {
      RequestItems: {
        [TABLE_NAME]: batch.map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    };

    debugLog(`Writing batch ${i + 1}/${batches.length} to DynamoDB`, options);

    const result = await docClient.send(new BatchWriteCommand(batchParams));

    if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
      debugLog(
        `Batch ${i + 1} had unprocessed items: ${JSON.stringify(result.UnprocessedItems)}`,
        options
      );
    } else {
      debugLog(`Batch ${i + 1} completed successfully`, options);
    }
  }
}

/**
 * Main import function
 */
async function importGuests(csvPath: string, options: ImportOptions = {}): Promise<void> {
  try {
    debugLog('Starting guest list import', options);

    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    // Process CSV
    debugLog('Processing CSV file', options);
    const guests = processCSV(csvPath, options);
    debugLog(`Found ${guests.length} guests in CSV`, options);

    // Create guest items
    debugLog('Creating guest and group records', options);
    const existingCodes = new Set<string>();
    const items = createGuestItems(guests, existingCodes, options);

    debugLog(`Created ${items.length} DynamoDB items (guests + groups)`, options);

    // Write to DynamoDB
    if (!options.dryRun) {
      debugLog('Writing items to DynamoDB', options);
      await batchWriteToDynamoDB(items, options);

      debugLog('Import completed successfully', options);

      // Generate invitation codes report
      if (options.generateReport) {
        const reportPath = path.join(path.dirname(csvPath), 'invitation-codes.csv');
        const reportContent = items
          .filter((i): i is GuestItem => i.item_type === 'GUEST')
          .map((i) => `${i.guest_name},${i.email},${i.invitation_code}`)
          .join('\n');

        fs.writeFileSync(reportPath, 'name,email,invitation_code\n' + reportContent);
        debugLog(`Invitation codes report saved to ${reportPath}`, options);
      }
    } else {
      debugLog('DRY RUN - No data was written to DynamoDB', options);
    }

    // Print sample invitation codes
    debugLog('Sample Invitation Codes:', options);
    items
      .filter((i): i is GuestItem => i.item_type === 'GUEST')
      .slice(0, 5)
      .forEach((guest) => {
        debugLog(
          `Sample: ${guest.guest_name} <${guest.email}> - Invitation Code: ${guest.invitation_code}`,
          options
        );
      });
  } catch (error) {
    debugLog('Import failed', options);
    if ((error as Error).stack && options.debug) {
      // eslint-disable-next-line no-console
      console.error((error as Error).stack);
    } else {
      // eslint-disable-next-line no-console
      console.error((error as Error).message);
    }
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    process.stdout.write(`
Wedding Guest List Import Script

Usage:
  ts-node add-guests.ts <csv-file> [options]

Options:
  --dry-run          Preview import without writing to database
  --generate-report  Generate invitation codes report CSV
  --debug            Show detailed error information
  --help             Show this help message

CSV Format:
  name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact
  
Example:
  ts-node add-guests.ts guests.csv
  ts-node add-guests.ts guests.csv --dry-run
  ts-node add-guests.ts guests.csv --generate-report

CSV Example:
  name,email,phone,plusOnesAllowed,groupName,groupId,isPrimaryContact
  John Doe,john@example.com,+1-555-0123,1,Doe Family,doe-family,true
  Jane Doe,jane@example.com,+1-555-0124,0,Doe Family,doe-family,false
  Bob Smith,bob@example.com,+1-555-0125,2,Smith Family,smith-family,true
    `);
    process.exit(0);
  }

  const csvPath = args[0];
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    generateReport: args.includes('--generate-report'),
    debug: args.includes('--debug'),
  };

  importGuests(csvPath, options).catch((err) => {
    if (options.debug) {
      // eslint-disable-next-line no-console
      console.error('[DEBUG] Unhandled error in importGuests:', err);
    }
    // Error handling in importGuests function
  });
}

export { importGuests, generateInvitationCode, generateNameBasedCode };
