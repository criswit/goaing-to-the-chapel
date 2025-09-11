import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';
import { AuthInfrastructure } from './auth-infrastructure';

export interface AdminApiProps {
  guestsTable: dynamodb.Table;
  rsvpsTable: dynamodb.Table;
  authInfrastructure: AuthInfrastructure;
  corsOrigin?: string;
}

export class AdminApi extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authFunction: lambda.Function;
  public readonly authorizerFunction: lambda.Function;
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly adminTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: AdminApiProps) {
    super(scope, id);

    // Create admin users table
    this.adminTable = new dynamodb.Table(this, 'AdminUsersTable', {
      tableName: 'WeddingAdmins',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Create Lambda layer for common dependencies
    const commonLayer = new lambda.LayerVersion(this, 'AdminCommonLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../layers/admin-common')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies for admin functions',
    });

    // Create admin authentication Lambda
    this.authFunction = new lambda.Function(this, 'AdminAuthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'admin-auth.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        ADMIN_TABLE_NAME: this.adminTable.tableName,
        JWT_PRIVATE_KEY_PARAM: `/wedding-rsvp/${cdk.Stack.of(this).stackName}/jwt/private-key`,
        CORS_ORIGIN: props.corsOrigin || '*',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [commonLayer],
    });

    // Create admin authorizer Lambda
    this.authorizerFunction = new lambda.Function(this, 'AdminAuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'verify-admin.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        JWT_PUBLIC_KEY_PARAM: `/wedding-rsvp/${cdk.Stack.of(this).stackName}/jwt/public-key`,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      layers: [commonLayer],
    });

    // Grant permissions
    this.adminTable.grantReadData(this.authFunction);
    this.adminTable.grantWriteData(this.authFunction);
    props.authInfrastructure.grantParameterAccess(this.authFunction);
    props.authInfrastructure.grantParameterAccess(this.authorizerFunction);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'AdminApi', {
      restApiName: 'Wedding RSVP Admin API',
      description: 'Admin API for wedding RSVP management',
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: props.corsOrigin ? [props.corsOrigin] : apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Create authorizer
    this.authorizer = new apigateway.TokenAuthorizer(this, 'AdminAuthorizer', {
      handler: this.authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // Create endpoints
    const adminResource = this.api.root.addResource('admin');

    // Auth endpoint (public)
    const authResource = adminResource.addResource('auth');
    authResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.authFunction, {
        proxy: true,
      })
    );

    // Protected endpoints
    const protectedResource = adminResource.addResource('protected');

    // Dashboard stats endpoint
    const statsFunction = this.createStatsFunction(props, commonLayer);
    const statsResource = protectedResource.addResource('stats');
    statsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(statsFunction, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
      }
    );

    // Guest list endpoint
    const guestsFunction = this.createGuestsFunction(props, commonLayer);
    const guestsResource = protectedResource.addResource('guests');
    guestsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(guestsFunction, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
      }
    );
    guestsResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(guestsFunction, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
      }
    );

    // Bulk operations endpoint - TODO: Implement admin-bulk.ts
    // const bulkFunction = this.createBulkOperationsFunction(props, commonLayer);
    // const bulkResource = protectedResource.addResource('bulk');
    // bulkResource.addMethod('POST', new apigateway.LambdaIntegration(bulkFunction, {
    //   proxy: true,
    // }), {
    //   authorizer: this.authorizer,
    // });

    // Export endpoint - TODO: Implement admin-export.ts
    // const exportFunction = this.createExportFunction(props, commonLayer);
    // const exportResource = protectedResource.addResource('export');
    // exportResource.addMethod('POST', new apigateway.LambdaIntegration(exportFunction, {
    //   proxy: true,
    // }), {
    //   authorizer: this.authorizer,
    // });
  }

  private createStatsFunction(props: AdminApiProps, layer: lambda.LayerVersion): lambda.Function {
    const fn = new lambda.Function(this, 'AdminStatsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'admin-stats.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        GUESTS_TABLE_NAME: props.guestsTable.tableName,
        RSVPS_TABLE_NAME: props.rsvpsTable.tableName,
        CORS_ORIGIN: props.corsOrigin || '*',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [layer],
    });

    props.guestsTable.grantReadData(fn);
    props.rsvpsTable.grantReadData(fn);

    return fn;
  }

  private createGuestsFunction(props: AdminApiProps, layer: lambda.LayerVersion): lambda.Function {
    const fn = new lambda.Function(this, 'AdminGuestsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'admin-guests.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        GUESTS_TABLE_NAME: props.guestsTable.tableName,
        RSVPS_TABLE_NAME: props.rsvpsTable.tableName,
        CORS_ORIGIN: props.corsOrigin || '*',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [layer],
    });

    props.guestsTable.grantReadWriteData(fn);
    props.rsvpsTable.grantReadWriteData(fn);

    return fn;
  }

  // TODO: Implement these functions when admin-bulk.ts and admin-export.ts are created
  // private createBulkOperationsFunction(
  //   props: AdminApiProps,
  //   layer: lambda.LayerVersion
  // ): lambda.Function {
  //   const fn = new lambda.Function(this, 'AdminBulkFunction', {
  //     runtime: lambda.Runtime.NODEJS_20_X,
  //     handler: 'admin-bulk.handler',
  //     code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
  //     environment: {
  //       GUESTS_TABLE_NAME: props.guestsTable.tableName,
  //       RSVPS_TABLE_NAME: props.rsvpsTable.tableName,
  //       CORS_ORIGIN: props.corsOrigin || '*',
  //     },
  //     timeout: cdk.Duration.minutes(5),
  //     memorySize: 1024,
  //     layers: [layer],
  //   });

  //   props.guestsTable.grantReadWriteData(fn);
  //   props.rsvpsTable.grantReadWriteData(fn);

  //   // Grant SES permissions for sending emails
  //   fn.addToRolePolicy(
  //     new iam.PolicyStatement({
  //       actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  //       resources: ['*'],
  //     })
  //   );

  //   return fn;
  // }

  // private createExportFunction(props: AdminApiProps, layer: lambda.LayerVersion): lambda.Function {
  //   const fn = new lambda.Function(this, 'AdminExportFunction', {
  //     runtime: lambda.Runtime.NODEJS_20_X,
  //     handler: 'admin-export.handler',
  //     code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
  //     environment: {
  //       GUESTS_TABLE_NAME: props.guestsTable.tableName,
  //       RSVPS_TABLE_NAME: props.rsvpsTable.tableName,
  //       CORS_ORIGIN: props.corsOrigin || '*',
  //     },
  //     timeout: cdk.Duration.minutes(2),
  //     memorySize: 1024,
  //     layers: [layer],
  //   });

  //   props.guestsTable.grantReadData(fn);
  //   props.rsvpsTable.grantReadData(fn);

  //   // Grant S3 permissions for storing exports
  //   fn.addToRolePolicy(
  //     new iam.PolicyStatement({
  //       actions: ['s3:PutObject', 's3:GetObject'],
  //       resources: ['arn:aws:s3:::wedding-rsvp-exports/*'],
  //     })
  //   );

  //   return fn;
  // }
}
