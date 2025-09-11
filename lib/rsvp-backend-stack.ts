import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { RsvpDatabase } from './backend/rsvp-database';
import { RsvpApi } from './backend/rsvp-api';
import { ApiDomainConfig } from './backend/api-domain-config';
import { AuthInfrastructure } from './backend/auth-infrastructure';
import { EmailInfrastructure } from './backend/email-infrastructure';
import { EmailLambdas } from './backend/email-lambdas';
import { EmailStreamProcessor } from './backend/email-stream-processor';
import { AdminApi } from './backend/admin-api';
import { FrontendConfig } from './backend/frontend-config';

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

  /**
   * Hosted zone ID for Route53 DNS records
   */
  hostedZoneId?: string;
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

  /**
   * The email infrastructure
   */
  public readonly emailInfrastructure: EmailInfrastructure;

  /**
   * The email Lambda functions
   */
  public readonly emailLambdas: EmailLambdas;

  /**
   * The email stream processor
   */
  public readonly emailStreamProcessor: EmailStreamProcessor;

  /**
   * The admin API
   */
  public readonly adminApi: AdminApi;

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

    // Look up hosted zone if ID is provided
    let hostedZone: route53.IHostedZone | undefined;
    if (props?.hostedZoneId && props?.domainName) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      });
    }

    // Create email infrastructure
    this.emailInfrastructure = new EmailInfrastructure(this, 'EmailInfrastructure', {
      domainName: props?.domainName || 'wedding.himnher.dev',
      environment,
      // notificationEmail: 'your-real-email@gmail.com', // Your actual email for bounce/complaint notifications
      forwardToEmail: 'whitfiecbeta@gmail.com', // Where to forward emails sent to admin@wedding.himnher.dev
      hostedZone, // Pass hosted zone for automatic DNS record creation
      verifyEmails: [
        // Add any test email addresses you want to verify here for testing
        // Example: 'your-email@gmail.com',
        // These will be automatically verified in SES for testing in sandbox mode
      ],
    });

    // Create email Lambda functions
    this.emailLambdas = new EmailLambdas(this, 'EmailLambdas', {
      emailInfrastructure: this.emailInfrastructure,
      table: this.database.table,
      environment,
      domainName: props?.domainName || 'wedding.himnher.dev',
      websiteUrl: props?.domainName ? `https://${props.domainName}` : 'https://wedding.himnher.dev',
    });

    // Create stream processor for email notifications
    this.emailStreamProcessor = new EmailStreamProcessor(this, 'EmailStreamProcessor', {
      table: this.database.table,
      emailQueue: this.emailInfrastructure.emailQueue,
      environment,
      domainName: props?.domainName || 'wedding.himnher.dev',
      websiteUrl: props?.domainName ? `https://${props.domainName}` : 'https://wedding.himnher.dev',
      alarmTopic: this.emailInfrastructure.bounceNotificationTopic, // Reuse the notification topic for alarms
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
    this.authInfrastructure.grantParameterAccess(this.api.functions.batchParty);
    this.authInfrastructure.grantParameterAccess(this.api.functions.createGuest);

    // Create Admin API
    this.adminApi = new AdminApi(this, 'AdminApi', {
      guestsTable: this.database.table,
      rsvpsTable: this.database.table,
      authInfrastructure: this.authInfrastructure,
      corsOrigin: '*', // Allow all origins for development - you can restrict this in production
    });

    // Configure custom domain for API
    // API will be available at api.wedding.himnher.dev
    if (props?.domainName) {
      this.apiDomain = new ApiDomainConfig(this, 'ApiDomain', {
        api: this.api.api,
        domainName: 'api.wedding.himnher.dev',
        environment: 'production',
      });
    }

    // Generate frontend configuration files
    new FrontendConfig(this, 'FrontendConfig', {
      mainApiUrl: this.api.api.url,
      adminApiUrl: this.adminApi.api.url,
      environment: 'production',
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      description: 'RSVP API Gateway endpoint URL',
      value: this.api.api.url,
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'AdminApiEndpoint', {
      description: 'Admin API Gateway endpoint URL',
      value: this.adminApi.api.url,
      exportName: `${this.stackName}-AdminApiEndpoint`,
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
