import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RsvpDatabase } from './backend/rsvp-database';
import { RsvpApi } from './backend/rsvp-api';
import { ApiDomainConfig } from './backend/api-domain-config';
import { AuthInfrastructure } from './backend/auth-infrastructure';

export interface RsvpBackendStackProps extends cdk.StackProps {
  /**
   * Allowed origins for CORS configuration
   * @default ['*']
   */
  allowedOrigins?: string[];

  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;

  /**
   * Custom domain name if available
   */
  domainName?: string;
}

export class RsvpBackendStack extends cdk.Stack {
  /**
   * The RSVP database construct
   */
  public readonly database: RsvpDatabase;

  /**
   * The RSVP API construct
   */
  public readonly api: RsvpApi;

  /**
   * The auth infrastructure
   */
  public readonly authInfrastructure: AuthInfrastructure;

  /**
   * The API domain configuration (if custom domain is enabled)
   */
  public readonly apiDomain?: ApiDomainConfig;

  constructor(scope: Construct, id: string, props?: RsvpBackendStackProps) {
    super(scope, id, props);

    // Everything is production
    const environment = 'production';

    // Create auth infrastructure for JWT management
    this.authInfrastructure = new AuthInfrastructure(this, 'AuthInfrastructure', {
      environment,
    });

    // Create RSVP database
    this.database = new RsvpDatabase(this, 'Database', {
      environment,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Always retain in production
    });

    // Determine CORS origins
    let allowedOrigins = props?.allowedOrigins;
    if (!allowedOrigins) {
      if (props?.domainName) {
        allowedOrigins = [
          `https://${props.domainName}`,
          `https://www.${props.domainName}`,
          'https://api.wedding.himnher.dev', // API domain
          'http://localhost:3000', // For local development
          'http://localhost:5173', // Vite dev server
        ];
      } else {
        allowedOrigins = ['*']; // Allow all origins if no custom domain
      }
    }

    // Create RSVP API
    this.api = new RsvpApi(this, 'Api', {
      table: this.database.table,
      environment,
      allowedOrigins,
    });

    // Grant Lambda functions access to auth parameters
    this.authInfrastructure.grantParameterAccess(this.api.functions.create);
    this.authInfrastructure.grantParameterAccess(this.api.functions.get);
    this.authInfrastructure.grantParameterAccess(this.api.functions.update);
    this.authInfrastructure.grantParameterAccess(this.api.functions.list);
    this.authInfrastructure.grantParameterAccess(this.api.functions.validate);

    // Configure custom domain for API
    // API will be available at api.wedding.himnher.dev
    if (props?.domainName) {
      this.apiDomain = new ApiDomainConfig(this, 'ApiDomain', {
        api: this.api.api,
        domainName: 'api.wedding.himnher.dev',
        environment: 'production',
      });
    }

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      description: 'RSVP API Gateway endpoint URL',
      value: this.api.api.url,
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      description: 'DynamoDB table name for RSVP data',
      value: this.database.table.tableName,
      exportName: `${this.stackName}-TableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      description: 'DynamoDB table ARN',
      value: this.database.table.tableArn,
      exportName: `${this.stackName}-TableArn`,
    });

    // Add stack-level tags
    cdk.Tags.of(this).add('Project', 'WeddingWebsite');
    cdk.Tags.of(this).add('Component', 'Backend');
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
