import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface RsvpDatabaseProps {
  /**
   * The removal policy for the database
   * @default RemovalPolicy.RETAIN
   */
  removalPolicy?: cdk.RemovalPolicy;

  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;
}

export class RsvpDatabase extends Construct {
  /**
   * The DynamoDB table for RSVP data
   */
  public readonly table: dynamodb.ITable;

  constructor(scope: Construct, id: string, props?: RsvpDatabaseProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';
    // Removal policy is not used currently as we're importing an existing table
    // const removalPolicy = props?.removalPolicy || cdk.RemovalPolicy.RETAIN;

    // Import existing DynamoDB table
    this.table = dynamodb.Table.fromTableAttributes(this, 'RsvpTable', {
      tableArn: `arn:aws:dynamodb:us-east-1:986718858331:table/wedding-rsvp-${environment}`,
      tableStreamArn: `arn:aws:dynamodb:us-east-1:986718858331:table/wedding-rsvp-${environment}/stream/2025-09-11T07:28:10.097`,
    });

    // Note: GSIs are already configured on the existing table
    // The existing table has the following GSIs:
    // - InvitationCodeIndex
    // - EventStatusIndex
    // - AdminDateIndex

    // Add tags
    cdk.Tags.of(this.table).add('Component', 'RSVP-Database');
    cdk.Tags.of(this.table).add('Environment', environment);
  }
}
