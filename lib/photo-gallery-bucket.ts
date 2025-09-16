import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface PhotoGalleryBucketProps {
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
   * Whether to enable public read access for photos
   * @default true
   */
  enablePublicRead?: boolean;

  /**
   * Allowed origins for CORS configuration
   * @default ['*']
   */
  corsAllowedOrigins?: string[];
}

export class PhotoGalleryBucket extends Construct {
  /**
   * The S3 bucket instance
   */
  public readonly bucket: s3.Bucket;

  /**
   * The bucket regional domain name
   */
  public readonly bucketDomainName: string;

  /**
   * Photo categories and their folder structure
   */
  public readonly photoCategories = {
    engagement: 'engagement',
    venue: 'venue',
    celebration: 'celebration',
    venuePreview: 'venue-preview',
  };

  /**
   * Photo size variants
   */
  public readonly sizeVariants = {
    thumbnail: 'thumbnails',
    full: 'full',
  };

  constructor(scope: Construct, id: string, props?: PhotoGalleryBucketProps) {
    super(scope, id);

    // Create S3 bucket for photo gallery
    this.bucket = new s3.Bucket(this, 'PhotoGalleryBucket', {
      bucketName: props?.bucketNamePrefix
        ? `${props.bucketNamePrefix}-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`
        : `wedding-photo-gallery-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,

      // Public access configuration
      publicReadAccess: false, // We'll use bucket policy for more granular control
      blockPublicAccess:
        props?.enablePublicRead === false
          ? s3.BlockPublicAccess.BLOCK_ALL
          : new s3.BlockPublicAccess({
              blockPublicAcls: false,
              ignorePublicAcls: false,
              blockPublicPolicy: false,
              restrictPublicBuckets: false,
            }),

      // Versioning and lifecycle
      versioned: props?.versioned ?? true,

      // Removal policy
      removalPolicy: props?.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props?.removalPolicy === cdk.RemovalPolicy.DESTROY,

      // Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
        {
          id: 'TransitionNonCurrentVersions',
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
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

      // CORS configuration for web gallery access
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT, // Allow uploads if needed later
          ],
          allowedOrigins: props?.corsAllowedOrigins ?? ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-version-id',
          ],
          maxAge: 3600,
        },
      ],

      // Server-side encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // Add bucket policy for public read access to photos only (not listing)
    if (props?.enablePublicRead !== false) {
      this.bucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'PublicReadGetObject',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:GetObject'],
          resources: [
            `${this.bucket.bucketArn}/*/*.jpg`,
            `${this.bucket.bucketArn}/*/*.jpeg`,
            `${this.bucket.bucketArn}/*/*.png`,
            `${this.bucket.bucketArn}/*/*.webp`,
            `${this.bucket.bucketArn}/*/*.gif`,
            `${this.bucket.bucketArn}/*/*/*.jpg`,
            `${this.bucket.bucketArn}/*/*/*.jpeg`,
            `${this.bucket.bucketArn}/*/*/*.png`,
            `${this.bucket.bucketArn}/*/*/*.webp`,
            `${this.bucket.bucketArn}/*/*/*.gif`,
          ],
        })
      );
    }

    // Store the bucket domain name
    this.bucketDomainName = this.bucket.bucketRegionalDomainName;

    // Create outputs
    this.createOutputs();
  }

  /**
   * Create CloudFormation outputs for bucket information
   */
  private createOutputs(): void {
    // Outputs are created at the stack level to avoid duplicates
    // These are kept commented for reference of available values

    // new cdk.CfnOutput(this, 'PhotoGalleryBucketName', {
    //   value: this.bucket.bucketName,
    //   description: 'Name of the S3 bucket hosting the photo gallery',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryBucketName`,
    // });

    // new cdk.CfnOutput(this, 'PhotoGalleryBucketArn', {
    //   value: this.bucket.bucketArn,
    //   description: 'ARN of the photo gallery S3 bucket',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryBucketArn`,
    // });

    // new cdk.CfnOutput(this, 'PhotoGalleryBucketDomainName', {
    //   value: this.bucketDomainName,
    //   description: 'Domain name of the photo gallery S3 bucket',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryBucketDomainName`,
    // });

    // Output the folder structure for reference
    new cdk.CfnOutput(this, 'PhotoGalleryStructure', {
      value: JSON.stringify({
        categories: this.photoCategories,
        sizeVariants: this.sizeVariants,
        examplePaths: [
          `${this.photoCategories.engagement}/${this.sizeVariants.thumbnail}/photo1.jpg`,
          `${this.photoCategories.engagement}/${this.sizeVariants.full}/photo1.jpg`,
          `${this.photoCategories.venue}/${this.sizeVariants.thumbnail}/venue1.jpg`,
          `${this.photoCategories.venue}/${this.sizeVariants.full}/venue1.jpg`,
        ],
      }),
      description: 'Photo gallery folder structure',
    });
  }

  /**
   * Get the S3 path for a specific photo category and size
   */
  public getPhotoPath(
    category: keyof typeof this.photoCategories,
    size: keyof typeof this.sizeVariants
  ): string {
    return `${this.photoCategories[category]}/${this.sizeVariants[size]}/`;
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
