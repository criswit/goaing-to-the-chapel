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

  test('S3 Bucket is created with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html',
      },
      VersioningConfiguration: {
        Status: 'Enabled',
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

  test('Bucket Policy allows public read access', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: 's3:GetObject',
            Resource: {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [Match.stringLikeRegexp('.*WebsiteBucket.*'), 'Arn'],
                  },
                  '/*',
                ],
              ],
            },
          },
        ]),
      },
    });
  });

  test('CloudFormation outputs are created', () => {
    template.hasOutput('WeddingWebsiteBucketName8D95022D', {});
    template.hasOutput('WeddingWebsiteWebsiteEndpointUrl61CD4A74', {});
    template.hasOutput('WeddingWebsiteBucketArnFCD42E2A', {});
    template.hasOutput('WeddingWebsiteBucketDomainName2B77C6FB', {});
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

  test('CORS configuration is applied', () => {
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
