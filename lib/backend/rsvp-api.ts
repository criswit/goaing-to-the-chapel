import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface RsvpApiProps {
  /**
   * The DynamoDB table for RSVP data
   */
  table: dynamodb.Table;

  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;

  /**
   * The frontend domain for CORS configuration
   */
  allowedOrigins?: string[];
}

export class RsvpApi extends Construct {
  /**
   * The API Gateway REST API
   */
  public readonly api: apigateway.RestApi;

  /**
   * The Lambda functions for RSVP operations
   */
  public readonly functions: {
    create: NodejsFunction;
    get: NodejsFunction;
    update: NodejsFunction;
    list: NodejsFunction;
    validate: NodejsFunction;
  };

  constructor(scope: Construct, id: string, props: RsvpApiProps) {
    super(scope, id);

    const environment = props.environment || 'dev';

    // Lambda execution role with DynamoDB permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(lambdaRole);

    // Common Lambda environment variables
    const lambdaEnvironment = {
      TABLE_NAME: props.table.tableName,
      REGION: cdk.Stack.of(this).region,
      STAGE: environment,
      LOG_LEVEL: 'INFO',
    };

    // Create Lambda functions
    this.functions = {
      create: new NodejsFunction(this, 'CreateRSVPFunction', {
        functionName: `wedding-create-rsvp-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X, // Using 20.x as 22.x might not be available in all regions
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/create-rsvp.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'CreateRSVPLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }),

      get: new NodejsFunction(this, 'GetRSVPFunction', {
        functionName: `wedding-get-rsvp-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/get-rsvp.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'GetRSVPLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }),

      update: new NodejsFunction(this, 'UpdateRSVPFunction', {
        functionName: `wedding-update-rsvp-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/update-rsvp.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'UpdateRSVPLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }),

      list: new NodejsFunction(this, 'ListRSVPsFunction', {
        functionName: `wedding-list-rsvps-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/list-rsvps.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'ListRSVPsLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }),

      validate: new NodejsFunction(this, 'ValidateInvitationFunction', {
        functionName: `wedding-validate-invitation-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/validate-invitation.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'ValidateInvitationLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }),
    };

    // Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'RsvpApi', {
      restApiName: `wedding-rsvp-api-${environment}`,
      description: 'REST API for wedding RSVP system',
      defaultCorsPreflightOptions: {
        allowOrigins: props.allowedOrigins || apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
    });

    // API Gateway resources and methods
    const rsvpResource = this.api.root.addResource('rsvp');

    // POST /rsvp - Create RSVP
    rsvpResource.addMethod('POST', new apigateway.LambdaIntegration(this.functions.create));

    // GET /rsvp - List RSVPs
    rsvpResource.addMethod('GET', new apigateway.LambdaIntegration(this.functions.list));

    // POST /rsvp/validate - Validate invitation code
    const validateResource = rsvpResource.addResource('validate');
    validateResource.addMethod('POST', new apigateway.LambdaIntegration(this.functions.validate));

    // Individual RSVP resource
    const rsvpIdResource = rsvpResource.addResource('{rsvpId}');

    // GET /rsvp/{rsvpId} - Get specific RSVP
    rsvpIdResource.addMethod('GET', new apigateway.LambdaIntegration(this.functions.get));

    // PUT /rsvp/{rsvpId} - Update RSVP
    rsvpIdResource.addMethod('PUT', new apigateway.LambdaIntegration(this.functions.update));

    // Add tags
    cdk.Tags.of(this).add('Component', 'RSVP-API');
    cdk.Tags.of(this).add('Environment', environment);
  }
}
