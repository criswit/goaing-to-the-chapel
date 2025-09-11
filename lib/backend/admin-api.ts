import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import { IAuthInfrastructure } from './auth-infrastructure-interface';

export interface AdminApiProps {
  guestsTable: dynamodb.ITable;
  rsvpsTable: dynamodb.ITable;
  authInfrastructure: IAuthInfrastructure;
  corsOrigin?: string;
}

export class AdminApi extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authFunction: lambda.Function;
  public readonly authorizerFunction: lambda.Function;
  public readonly authorizer?: apigateway.TokenAuthorizer;
  public readonly adminTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: AdminApiProps) {
    super(scope, id);

    // Import existing admin users table
    this.adminTable = dynamodb.Table.fromTableAttributes(this, 'AdminUsersTable', {
      tableArn: 'arn:aws:dynamodb:us-east-1:986718858331:table/WeddingAdmins',
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
        JWT_PRIVATE_KEY_PARAM: `/wedding-rsvp/production/jwt/private-key`,
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
        JWT_PUBLIC_KEY_PARAM: `/wedding-rsvp/production/jwt/public-key`,
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
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false, // Can't use credentials with ALL_ORIGINS
      },
    });

    // Add Gateway Responses for proper CORS on errors (like 401 Unauthorized)
    const corsHeaders = {
      'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
      'gatewayresponse.header.Access-Control-Allow-Headers':
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Auth-Token'",
      'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      'gatewayresponse.header.Access-Control-Allow-Credentials': "'true'",
    };

    // Add CORS headers to 4XX responses (including 401 Unauthorized)
    this.api.addGatewayResponse('Default4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: corsHeaders,
    });

    // Add CORS headers to 5XX responses
    this.api.addGatewayResponse('Default5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: corsHeaders,
    });

    // Create TokenAuthorizer for JWT validation
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

    // Add path parameter route for individual guest updates
    const guestDetailResource = guestsResource.addResource('{invitationCode}');
    guestDetailResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(guestsFunction, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
      }
    );
    guestDetailResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(guestsFunction, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
      }
    );
    guestDetailResource.addMethod(
      'DELETE',
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
        TABLE_NAME: 'wedding-rsvp-production', // Override to ensure correct table name
        CORS_ORIGIN: props.corsOrigin || '*',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [layer],
    });

    // Grant access to the correct table directly
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:ConditionCheckItem',
          'dynamodb:DescribeTable',
          'dynamodb:GetItem',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [`arn:aws:dynamodb:us-east-1:986718858331:table/wedding-rsvp-production`],
      })
    );

    return fn;
  }

  private createGuestsFunction(props: AdminApiProps, layer: lambda.LayerVersion): lambda.Function {
    const fn = new lambda.Function(this, 'AdminGuestsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'admin-guests.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        TABLE_NAME: 'wedding-rsvp-production', // Override to ensure correct table name
        CORS_ORIGIN: props.corsOrigin || '*',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [layer],
    });

    // Grant access to the correct table directly
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:BatchWriteItem',
          'dynamodb:ConditionCheckItem',
          'dynamodb:DeleteItem',
          'dynamodb:DescribeTable',
          'dynamodb:GetItem',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:UpdateItem',
        ],
        resources: [`arn:aws:dynamodb:us-east-1:986718858331:table/wedding-rsvp-production`],
      })
    );

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
