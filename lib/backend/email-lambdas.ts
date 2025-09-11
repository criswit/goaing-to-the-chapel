import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { EmailInfrastructure } from './email-infrastructure';

export interface EmailLambdasProps {
  /**
   * The email infrastructure containing queues and configuration
   */
  emailInfrastructure: EmailInfrastructure;

  /**
   * The DynamoDB table for RSVP data
   */
  table: dynamodb.Table;

  /**
   * Environment name for resource naming
   */
  environment: string;

  /**
   * The domain name for email sending
   */
  domainName: string;

  /**
   * The website URL for email templates
   */
  websiteUrl: string;
}

export class EmailLambdas extends Construct {
  /**
   * Lambda function for sending emails
   */
  public readonly sendEmailFunction: NodejsFunction;

  /**
   * Lambda function for processing email queue
   */
  public readonly processEmailQueueFunction: NodejsFunction;

  /**
   * Lambda function for processing bounce notifications
   */
  public readonly processBounceFunction: NodejsFunction;

  /**
   * Lambda function for processing complaint notifications
   */
  public readonly processComplaintFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: EmailLambdasProps) {
    super(scope, id);

    const lambdaEnvironment = {
      TABLE_NAME: props.table.tableName,
      SOURCE_EMAIL: `espoused@${props.domainName}`,
      CONFIGURATION_SET: `wedding-rsvp-${props.environment}`,
      WEBSITE_URL: props.websiteUrl,
      ENVIRONMENT: props.environment,
      SES_SANDBOX_MODE: 'true', // Enable sandbox mode to handle unverified emails gracefully
    };

    // Don't create a shared role to avoid circular dependencies
    // Each Lambda will get its own role

    // Create Send Email Lambda Function
    this.sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `wedding-send-email-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/send-email.ts'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: lambdaEnvironment,
      logGroup: new logs.LogGroup(this, 'SendEmailLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Create Process Email Queue Lambda Function
    this.processEmailQueueFunction = new NodejsFunction(this, 'ProcessEmailQueueFunction', {
      functionName: `wedding-process-email-queue-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/process-email-queue.ts'),
      timeout: cdk.Duration.seconds(300), // 5 minutes for batch processing
      memorySize: 1024,
      environment: {
        ...lambdaEnvironment,
        SEND_EMAIL_FUNCTION_NAME: this.sendEmailFunction.functionName,
      },
      logGroup: new logs.LogGroup(this, 'ProcessEmailQueueLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Create Process Bounce Lambda Function
    this.processBounceFunction = new NodejsFunction(this, 'ProcessBounceFunction', {
      functionName: `wedding-process-bounce-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/process-bounce.ts'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: lambdaEnvironment,
      logGroup: new logs.LogGroup(this, 'ProcessBounceLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Create Process Complaint Lambda Function
    this.processComplaintFunction = new NodejsFunction(this, 'ProcessComplaintFunction', {
      functionName: `wedding-process-complaint-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/process-complaint.ts'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: lambdaEnvironment,
      logGroup: new logs.LogGroup(this, 'ProcessComplaintLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Grant DynamoDB permissions to each Lambda function
    props.table.grantReadWriteData(this.sendEmailFunction);
    props.table.grantReadWriteData(this.processEmailQueueFunction);
    props.table.grantReadWriteData(this.processBounceFunction);
    props.table.grantReadWriteData(this.processComplaintFunction);

    // Grant SES permissions to send email function
    props.emailInfrastructure.grantSendEmail(this.sendEmailFunction);

    // Grant Lambda invoke permissions to process email queue function
    this.sendEmailFunction.grantInvoke(this.processEmailQueueFunction);

    // Add SQS event sources - these automatically grant the necessary permissions
    this.sendEmailFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(props.emailInfrastructure.emailQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    this.processBounceFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(props.emailInfrastructure.bounceQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    this.processComplaintFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(props.emailInfrastructure.complaintQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    // Note: We don't need to separately grant queue access permissions
    // because SqsEventSource automatically grants the necessary permissions

    // Output function ARNs
    new cdk.CfnOutput(this, 'SendEmailFunctionArn', {
      value: this.sendEmailFunction.functionArn,
      description: 'Send Email Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'ProcessEmailQueueFunctionArn', {
      value: this.processEmailQueueFunction.functionArn,
      description: 'Process Email Queue Lambda Function ARN',
    });
  }

  /**
   * Grant permission to invoke the send email function
   */
  public grantInvokeSendEmail(grantee: iam.IGrantable): void {
    this.sendEmailFunction.grantInvoke(grantee);
  }

  /**
   * Grant permission to send messages to the email queue
   */
  public grantSendToEmailQueue(_grantee: iam.IGrantable): void {
    // This is handled through the emailInfrastructure
  }
}
