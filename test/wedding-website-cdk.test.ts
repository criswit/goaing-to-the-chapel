import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as WeddingWebsiteCdk from '../lib/wedding-website-cdk-stack';

describe('WeddingWebsiteCdkStack', () => {
  let app: cdk.App;
  let stack: WeddingWebsiteCdk.WeddingWebsiteCdkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'MyTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('S3 Bucket is created with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('CloudFront Distribution is created', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Enabled: true,
        HttpVersion: 'http2and3',
        PriceClass: 'PriceClass_100',
        DefaultRootObject: 'index.html',
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
          CachePolicyId: Match.anyValue(),
        },
      },
    });
  });

  test('CloudFront has error pages configured', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: Match.arrayWith([
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTtl: 300,
          },
        ]),
      },
    });
  });

  test('S3 Bucket has lifecycle configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          {
            Id: 'TransitionNonCurrentVersions',
            Status: 'Enabled',
            NoncurrentVersionTransitions: [
              {
                StorageClass: 'GLACIER',
                TransitionInDays: 30,
              },
            ],
            NoncurrentVersionExpiration: {
              NoncurrentDays: 90,
            },
          },
          {
            Id: 'CleanupIncompleteMultipartUploads',
            Status: 'Enabled',
            AbortIncompleteMultipartUpload: {
              DaysAfterInitiation: 7,
            },
          },
        ]),
      },
    });
  });

  test('Origin Access Identity is created for CloudFront', () => {
    template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
      CloudFrontOriginAccessIdentityConfig: {
        Comment: Match.anyValue(),
      },
    });
  });

  test('CloudFormation outputs are created', () => {
    // Check for CloudFront-related outputs
    template.hasOutput('CloudFrontDistributionDomainNameCC42BA43', {});
    template.hasOutput('CloudFrontDistributionId1F0C3D04', {});
    template.hasOutput('WeddingWebsiteBucketName8D95022D', {});
    template.hasOutput('WeddingWebsiteBucketArnFCD42E2A', {});
  });

  test('Stack has appropriate tags', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        {
          Key: 'Project',
          Value: 'WeddingWebsite',
        },
      ]),
    });
  });

  test('CORS configuration is applied to S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            MaxAge: 3600,
          },
        ],
      },
    });
  });

  test('CloudFront logs bucket is created', () => {
    // Check that a logs bucket exists
    const buckets = template.findResources('AWS::S3::Bucket');
    const logsBucket = Object.entries(buckets).find(([key]) =>
      key.includes('CloudFrontLogsBucket')
    );
    expect(logsBucket).toBeDefined();
  });
});

describe('WeddingWebsiteCdkStack with deployment', () => {
  test('Stack can be created with build path context', () => {
    const app = new cdk.App({
      context: {
        buildPath: './build',
      },
    });

    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStackWithDeployment', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    const template = Template.fromStack(stack);

    // Just check that the stack is created successfully with the context
    expect(template).toBeDefined();
    expect(stack.websiteBucket).toBeDefined();
  });
});

describe('RsvpBackendStack', () => {
  test('DynamoDB table is created with correct configuration', () => {
    const app = new cdk.App();
    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Check for DynamoDB table with single-table design
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      SSESpecification: {
        SSEEnabled: true,
      },
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE',
        },
      ],
    });
  });

  test('DynamoDB table has Global Secondary Indexes', () => {
    const app = new cdk.App();
    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Check for GSIs
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'InvitationCodeIndex',
        }),
        Match.objectLike({
          IndexName: 'EventStatusIndex',
        }),
        Match.objectLike({
          IndexName: 'AdminDateIndex',
        }),
      ]),
    });
  });

  test('API Gateway REST API is created', () => {
    const app = new cdk.App();
    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: Match.stringLikeRegexp('wedding-rsvp-api-.*'),
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
    });
  });

  test('Lambda functions are created with correct runtime', () => {
    const app = new cdk.App();
    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Check for Lambda functions with Node.js 20.x runtime
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      MemorySize: 256,
      Timeout: 30,
    });
  });

  test('Lambda functions have DynamoDB permissions', () => {
    const app = new cdk.App();
    const stack = new WeddingWebsiteCdk.WeddingWebsiteCdkStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Check for IAM role with DynamoDB permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
            ]),
          }),
        ]),
      },
    });
  });
});
