#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Script to create an admin user for the Wedding RSVP system
 * Usage: npm run create-admin
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

// Configuration
const ADMIN_TABLE_NAME = process.env.ADMIN_TABLE_NAME || 'WeddingAdmins';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Create DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt for input
const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function createAdminUser() {
  console.log('=================================');
  console.log('Wedding RSVP Admin User Creation');
  console.log('=================================\n');

  try {
    // Gather user information
    const email = await prompt('Enter admin email address: ');
    const name = await prompt('Enter admin name: ');
    const password = await prompt('Enter password (min 8 characters): ');
    const confirmPassword = await prompt('Confirm password: ');

    // Validate input
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const roleChoice = await prompt('Select role (1 = ADMIN, 2 = SUPER_ADMIN): ');
    const role = roleChoice === '2' ? 'SUPER_ADMIN' : 'ADMIN';

    // Hash the password
    console.log('\nHashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the admin user object
    const adminUser = {
      email,
      passwordHash,
      name,
      role,
      createdAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    console.log('Saving admin user to DynamoDB...');
    console.log(`Table: ${ADMIN_TABLE_NAME}`);
    console.log(`Region: ${REGION}`);

    const command = new PutCommand({
      TableName: ADMIN_TABLE_NAME,
      Item: adminUser,
      ConditionExpression: 'attribute_not_exists(email)', // Prevent overwriting existing users
    });

    await docClient.send(command);

    console.log('\n✅ Admin user created successfully!');
    console.log('=================================');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    console.log(`Table: ${ADMIN_TABLE_NAME}`);
    console.log('=================================');
    console.log('\nYou can now log in at:');
    console.log('Production: https://wedding.himnher.dev/admin/login');
    console.log('Local: http://localhost:3000/admin/login');
  } catch (error: unknown) {
    console.error('\n❌ Error creating admin user:');
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      console.error('User with this email already exists');
    } else if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      console.error(
        `Table ${ADMIN_TABLE_NAME} not found. Make sure the infrastructure is deployed:`
      );
      console.error('Run: npx cdk deploy RsvpBackendStack');
    } else if (
      typeof error === 'object' &&
      error !== null &&
      '$metadata' in error &&
      (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 400
    ) {
      console.error('AWS credentials not configured or invalid');
      console.error('Please configure AWS credentials using:');
      console.error('  aws configure');
      console.error('OR');
      console.error('  export AWS_ACCESS_KEY_ID=your_key');
      console.error('  export AWS_SECRET_ACCESS_KEY=your_secret');
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Main execution
async function main() {
  console.log('Starting admin user creation...\n');

  // Check if AWS credentials are set
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    console.log('⚠️  AWS credentials may not be configured.');
    console.log('If you encounter errors, ensure AWS credentials are set.\n');
  }

  await createAdminUser();
}

// Run the script
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
