import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface WebsiteBucketProps {
  /**
   * Name prefix for the S3 bucket
   */
  bucketNamePrefix?: string;

  /**
   * Whether to enable versioning on the bucket
   * @default true
   */
  versioned?: boolean;

  /**
   * Removal policy for the bucket
   * @default cdk.RemovalPolicy.DESTROY for development
   */
  removalPolicy?: cdk.RemovalPolicy;

  /**
   * Path to the React build artifacts to deploy
   */
  buildPath?: string;

  /**
   * Enable deployment of React build artifacts
   * @default false
   */
  enableDeployment?: boolean;
}

export class WebsiteBucket extends Construct {
  /**
   * The S3 bucket instance
   */
  public readonly bucket: s3.Bucket;

  /**
   * The bucket deployment (if enabled)
   */
  public readonly deployment?: s3deploy.BucketDeployment;

  /**
   * The website endpoint URL
   */
  public readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props?: WebsiteBucketProps) {
    super(scope, id);

    // Create S3 bucket for static website hosting
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: props?.bucketNamePrefix
        ? `${props.bucketNamePrefix}-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`
        : undefined,

      // Block all public access - CloudFront will access via OAI
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Versioning and lifecycle
      versioned: props?.versioned ?? true,

      // Removal policy - DESTROY for development, RETAIN for production
      removalPolicy: props?.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props?.removalPolicy === cdk.RemovalPolicy.DESTROY,

      // Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'TransitionNonCurrentVersions',
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'CleanupIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],

      // CORS configuration for web applications
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Note: Bucket policy will be added by CloudFront for OAI access
    // No public bucket policy needed since CloudFront will handle access

    // Store the bucket regional domain name for CloudFront
    this.websiteUrl = `https://${this.bucket.bucketRegionalDomainName}`;

    // Deploy React build artifacts if enabled
    if (props?.enableDeployment && props?.buildPath) {
      this.deployment = new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
        sources: [s3deploy.Source.asset(props.buildPath)],
        destinationBucket: this.bucket,

        // Cache control headers for optimization
        cacheControl: [
          // HTML files - no cache to ensure fresh content
          s3deploy.CacheControl.setPublic(),
          s3deploy.CacheControl.maxAge(cdk.Duration.seconds(0)),
          s3deploy.CacheControl.mustRevalidate(),
        ],

        // Prune old files that are no longer in the source
        prune: true,

        // Memory and timeout for the deployment Lambda
        memoryLimit: 512,
        ephemeralStorageSize: cdk.Size.gibibytes(2),
      });

      // Add specific cache control for different file types
      new s3deploy.BucketDeployment(this, 'StaticAssetsDeployment', {
        sources: [
          s3deploy.Source.asset(props.buildPath, {
            exclude: ['*.html'],
          }),
        ],
        destinationBucket: this.bucket,

        // Long cache for static assets (JS, CSS, images)
        cacheControl: [
          s3deploy.CacheControl.setPublic(),
          s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
          s3deploy.CacheControl.immutable(),
        ],

        prune: false, // Don't prune as this is a subset deployment
      });
    }

    // Export important information as CloudFormation outputs
    this.createOutputs();
  }

  /**
   * Create CloudFormation outputs for bucket information
   */
  private createOutputs(): void {
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket hosting the website',
      exportName: `${cdk.Stack.of(this).stackName}-BucketName`,
    });

    new cdk.CfnOutput(this, 'WebsiteEndpointUrl', {
      value: this.websiteUrl,
      description: 'S3 website endpoint URL',
      exportName: `${cdk.Stack.of(this).stackName}-WebsiteUrl`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'ARN of the S3 bucket',
      exportName: `${cdk.Stack.of(this).stackName}-BucketArn`,
    });

    new cdk.CfnOutput(this, 'BucketDomainName', {
      value: this.bucket.bucketDomainName,
      description: 'Domain name of the S3 bucket',
      exportName: `${cdk.Stack.of(this).stackName}-BucketDomainName`,
    });
  }

  /**
   * Grant read permissions to a principal
   */
  public grantRead(identity: iam.IGrantable): iam.Grant {
    return this.bucket.grantRead(identity);
  }

  /**
   * Grant read/write permissions to a principal
   */
  public grantReadWrite(identity: iam.IGrantable): iam.Grant {
    return this.bucket.grantReadWrite(identity);
  }

  /**
   * Add additional lifecycle rules
   */
  public addLifecycleRule(rule: s3.LifecycleRule): void {
    this.bucket.addLifecycleRule(rule);
  }
}
