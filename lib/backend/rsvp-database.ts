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
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: RsvpDatabaseProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';
    const removalPolicy = props?.removalPolicy || cdk.RemovalPolicy.RETAIN;

    // Create DynamoDB table with single-table design
    this.table = new dynamodb.Table(this, 'RsvpTable', {
      tableName: `wedding-rsvp-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: removalPolicy,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    /**
     * GSI1: InvitationCodeIndex
     * Purpose: Guest lookup by invitation code
     * Access Pattern: Find guest using unique invitation code
     * PK: InvitationCode (e.g., "INVITATION#ABC123")
     * SK: created_at
     */
    this.table.addGlobalSecondaryIndex({
      indexName: 'InvitationCodeIndex',
      partitionKey: { name: 'InvitationCode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    /**
     * GSI2: EventStatusIndex
     * Purpose: Filter guests by RSVP status within an event
     * Access Pattern: List all attending/not_attending/maybe guests for an event
     * PK: EventStatus (e.g., "EVENT#123#STATUS#attending")
     * SK: updated_at
     */
    this.table.addGlobalSecondaryIndex({
      indexName: 'EventStatusIndex',
      partitionKey: { name: 'EventStatus', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updated_at', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    /**
     * GSI3: AdminDateIndex
     * Purpose: Admin queries by date and status across all events
     * Access Pattern: Find all RSVPs updated on specific dates with specific statuses
     * PK: EntityType (constant "ADMIN" for all relevant records)
     * SK: AdminDate (e.g., "DATE#2024-03-15#STATUS#attending")
     */
    this.table.addGlobalSecondaryIndex({
      indexName: 'AdminDateIndex',
      partitionKey: { name: 'EntityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'AdminDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        'guest_name',
        'email',
        'rsvp_status',
        'event_id',
        'plus_ones_count',
        'updated_at',
      ],
    });

    // Add tags
    cdk.Tags.of(this.table).add('Component', 'RSVP-Database');
    cdk.Tags.of(this.table).add('Environment', environment);
  }
}
