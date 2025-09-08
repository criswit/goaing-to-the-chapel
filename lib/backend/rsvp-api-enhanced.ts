/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AuthInfrastructure } from './auth-infrastructure';

export interface EnhancedRsvpApiProps {
  /**
   * The DynamoDB table for RSVP data
   */
  table: dynamodb.Table;

  /**
   * Auth infrastructure for JWT management
   */
  authInfrastructure: AuthInfrastructure;

  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;

  /**
   * The frontend domain for CORS configuration
   */
  allowedOrigins?: string[];

  /**
   * Admin email addresses for role assignment
   */
  adminEmails?: string[];
}

export class EnhancedRsvpApi extends Construct {
  /**
   * The API Gateway REST API
   */
  public readonly api: apigateway.RestApi;

  /**
   * The Lambda functions for RSVP operations
   */
  public readonly functions: {
    // Authentication functions
    validateInvitation: NodejsFunction;
    generateToken: NodejsFunction;

    // RSVP functions
    getRsvp: NodejsFunction;
    createRsvp: NodejsFunction;
    getRsvpStatus: NodejsFunction;
    listRsvps: NodejsFunction;
  };

  constructor(scope: Construct, id: string, props: EnhancedRsvpApiProps) {
    super(scope, id);

    const environment = props.environment || 'dev';
    const adminEmails = props.adminEmails?.join(',') || '';

    // Lambda execution role with enhanced permissions
    const lambdaRole = new iam.Role(this, 'EnhancedLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(lambdaRole);

    // Grant SSM Parameter Store permissions for JWT keys
    props.authInfrastructure.grantParameterAccess(lambdaRole);

    // Common Lambda environment variables
    const lambdaEnvironment = {
      TABLE_NAME: props.table.tableName,
      SECURITY_TABLE_NAME: props.table.tableName, // Using same table for security logs
      REGION: cdk.Stack.of(this).region,
      ENVIRONMENT: environment,
      LOG_LEVEL: 'INFO',
      ADMIN_EMAILS: adminEmails,
    };

    // Create Lambda functions

    // Authentication functions
    this.functions = {
      validateInvitation: new NodejsFunction(this, 'ValidateInvitationFunction', {
        functionName: `wedding-validate-invitation-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/validate-invitation.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'ValidateInvitationLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),

      generateToken: new NodejsFunction(this, 'GenerateTokenFunction', {
        functionName: `wedding-generate-token-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/auth-token-generator.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'GenerateTokenLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),

      // RSVP functions
      getRsvp: new NodejsFunction(this, 'GetRsvpFunction', {
        functionName: `wedding-get-rsvp-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/get-rsvp.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'GetRsvpLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),

      createRsvp: new NodejsFunction(this, 'CreateRsvpFunction', {
        functionName: `wedding-create-rsvp-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/create-rsvp.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'CreateRsvpLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),

      getRsvpStatus: new NodejsFunction(this, 'GetRsvpStatusFunction', {
        functionName: `wedding-get-rsvp-status-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/get-rsvp-status.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'GetRsvpStatusLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),

      listRsvps: new NodejsFunction(this, 'ListRsvpsFunction', {
        functionName: `wedding-list-rsvps-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/list-rsvps.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: lambdaEnvironment,
        logGroup: new logs.LogGroup(this, 'ListRsvpsLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          nodeModules: ['jsonwebtoken', 'zod'],
        },
      }),
    };

    // Create API Gateway REST API with rate limiting
    this.api = new apigateway.RestApi(this, 'EnhancedRsvpApi', {
      restApiName: `wedding-rsvp-api-${environment}`,
      description: 'Enhanced REST API for wedding RSVP system with authentication',
      defaultCorsPreflightOptions: {
        allowOrigins: props.allowedOrigins || apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Auth-Token',
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
        // Rate limiting
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      cloudWatchRole: true,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // Create usage plan for rate limiting
    this.api.addUsagePlan('RsvpUsagePlan', {
      name: `wedding-rsvp-usage-plan-${environment}`,
      description: 'Usage plan with rate limiting for RSVP API',
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100, // requests per second
        burstLimit: 200, // burst capacity
      },
      quota: {
        limit: 10000, // requests per day
        period: apigateway.Period.DAY,
      },
    });

    // API Gateway request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      requestValidatorName: 'Validate body and parameters',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // ===== API Routes =====
    const apiRoot = this.api.root.addResource('api');

    // Authentication endpoints
    const authResource = apiRoot.addResource('auth');

    // POST /api/auth/validate - Validate invitation code
    authResource
      .addResource('validate')
      .addMethod('POST', new apigateway.LambdaIntegration(this.functions.validateInvitation), {
        requestValidator,
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '404' },
          { statusCode: '500' },
        ],
      });

    // POST /api/auth/token - Generate JWT token
    authResource
      .addResource('token')
      .addMethod('POST', new apigateway.LambdaIntegration(this.functions.generateToken), {
        requestValidator,
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '401' },
          { statusCode: '500' },
        ],
      });

    // RSVP endpoints
    const rsvpResource = apiRoot.addResource('rsvp');

    // POST /api/rsvp - Create/Update RSVP
    rsvpResource.addMethod('POST', new apigateway.LambdaIntegration(this.functions.createRsvp), {
      requestValidator,
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '201' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '429' },
        { statusCode: '500' },
      ],
    });

    // GET /api/rsvp (admin only) - List all RSVPs
    rsvpResource.addMethod('GET', new apigateway.LambdaIntegration(this.functions.listRsvps), {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '500' },
      ],
    });

    // Individual invitation endpoints
    const invitationResource = rsvpResource.addResource('{invitationCode}');

    // GET /api/rsvp/{invitationCode} - Get RSVP details
    invitationResource.addMethod('GET', new apigateway.LambdaIntegration(this.functions.getRsvp), {
      requestValidator,
      requestParameters: {
        'method.request.path.invitationCode': true,
      },
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '500' },
      ],
    });

    // GET /api/rsvp/{invitationCode}/status - Get RSVP status
    const statusResource = invitationResource.addResource('status');
    statusResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.functions.getRsvpStatus),
      {
        requestValidator,
        requestParameters: {
          'method.request.path.invitationCode': true,
        },
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '401' },
          { statusCode: '403' },
          { statusCode: '404' },
          { statusCode: '500' },
        ],
      }
    );

    // Add per-method throttling for sensitive endpoints
    const authValidateMethod = authResource.getResource('validate')?.defaultMethodOptions;
    if (authValidateMethod) {
      (authValidateMethod as any).throttle = {
        rateLimit: 5, // 5 requests per second
        burstLimit: 10,
      };
    }

    // Output API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'RSVP API endpoint URL',
    });

    // Add tags
    cdk.Tags.of(this).add('Component', 'Enhanced-RSVP-API');
    cdk.Tags.of(this).add('Environment', environment);
  }
}
