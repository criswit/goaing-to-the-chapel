import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { WebsiteBucket } from './website-bucket';
import { CloudFrontDistribution } from './cloudfront-distribution';
import { DnsConfig, DnsSetup } from './dns-config';
import { PhotoGalleryBucket } from './photo-gallery-bucket';
import { PhotoGalleryCloudFront } from './photo-gallery-cloudfront';

export interface WeddingWebsiteCdkStackProps extends cdk.StackProps {
  /**
   * Optional DNS configuration for custom domain
   */
  dnsConfig?: DnsConfig;
}

export class WeddingWebsiteCdkStack extends cdk.Stack {
  /**
   * The website bucket construct
   */
  public readonly websiteBucket: WebsiteBucket;

  /**
   * The CloudFront distribution construct
   */
  public readonly cloudFrontDistribution: CloudFrontDistribution;

  /**
   * The DNS setup construct (if configured)
   */
  public readonly dnsSetup?: DnsSetup;

  /**
   * The photo gallery bucket construct
   */
  public readonly photoGalleryBucket: PhotoGalleryBucket;

  /**
   * The photo gallery CloudFront distribution
   */
  public readonly photoGalleryCloudFront: PhotoGalleryCloudFront;

  constructor(scope: Construct, id: string, props?: WeddingWebsiteCdkStackProps) {
    super(scope, id, props);

    // Create the S3 static website hosting infrastructure
    this.websiteBucket = new WebsiteBucket(this, 'WeddingWebsite', {
      bucketNamePrefix: 'wedding-website',
      versioned: true,
      removalPolicy: this.getRemovalPolicy(),
      // Enable deployment if build path is provided via context
      enableDeployment: this.node.tryGetContext('buildPath') ? true : false,
      buildPath: this.node.tryGetContext('buildPath'),
    });

    // Fix permissions for auto-delete Lambda when using DESTROY removal policy
    if (this.getRemovalPolicy() === cdk.RemovalPolicy.DESTROY) {
      // Store reference for the aspect
      const bucketArn = this.websiteBucket.bucket.bucketArn;

      // Use Aspects to find and modify the auto-delete Lambda role after synthesis
      cdk.Aspects.of(this).add({
        visit(node: Construct) {
          // Look for the custom resource provider role
          if (
            node instanceof iam.Role &&
            node.node.id.includes('CustomS3AutoDeleteObjectsCustomResourceProviderRole')
          ) {
            // Add the missing S3 permissions
            node.addToPolicy(
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetBucketTagging',
                  's3:GetBucketVersioning',
                  's3:ListBucketVersions',
                  's3:GetBucketLocation',
                ],
                resources: [bucketArn],
              })
            );
          }
        },
      });
    }

    // Prepare certificate if DNS config is provided
    let certificate: acm.ICertificate | undefined;
    if (props?.dnsConfig) {
      if (props.dnsConfig.certificateArn) {
        // Import existing certificate
        certificate = acm.Certificate.fromCertificateArn(
          this,
          'ImportedCertificate',
          props.dnsConfig.certificateArn
        );
      } else {
        // Create new certificate for the domain
        // Import the hosted zone first for validation
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'TempHostedZone', {
          hostedZoneId: props.dnsConfig.hostedZoneId,
          zoneName: props.dnsConfig.domainName.split('.').slice(-2).join('.'),
        });

        certificate = new acm.Certificate(this, 'Certificate', {
          domainName: props.dnsConfig.domainName,
          subjectAlternativeNames: props.dnsConfig.includeWww
            ? [`www.${props.dnsConfig.domainName}`]
            : undefined,
          validation: acm.CertificateValidation.fromDns(hostedZone),
        });
      }
    }

    // Create Photo Gallery infrastructure
    this.photoGalleryBucket = new PhotoGalleryBucket(this, 'PhotoGallery', {
      bucketNamePrefix: 'wedding-photo-gallery',
      versioned: true,
      removalPolicy: this.getRemovalPolicy(),
      enablePublicRead: true,
      corsAllowedOrigins: props?.dnsConfig?.domainName
        ? [
            `https://${props.dnsConfig.domainName}`,
            `https://www.${props.dnsConfig.domainName}`,
            'http://localhost:3000', // For local development
          ]
        : ['*'],
    });

    // Create Photo Gallery CloudFront distribution
    this.photoGalleryCloudFront = new PhotoGalleryCloudFront(this, 'PhotoGalleryCDN', {
      photoBucket: this.photoGalleryBucket,
      // Don't use custom domain - certificate doesn't cover photos subdomain
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Create CloudFront distribution
    this.cloudFrontDistribution = new CloudFrontDistribution(this, 'CloudFront', {
      websiteBucket: this.websiteBucket.bucket,
      enableGeoRestrictions: false, // Set to true and provide allowedCountries if needed
      // allowedCountries: ['US', 'CA', 'GB'], // Uncomment and modify as needed
      domainName: props?.dnsConfig?.domainName,
      certificate: certificate,
      alternativeDomainNames:
        props?.dnsConfig?.includeWww && props?.dnsConfig?.domainName
          ? [`www.${props.dnsConfig.domainName}`]
          : undefined,
    });

    // Set up DNS if configuration is provided
    if (props?.dnsConfig) {
      this.dnsSetup = new DnsSetup(this, 'DnsSetup', {
        dnsConfig: props.dnsConfig,
        distribution: this.cloudFrontDistribution.distribution,
        existingCertificate: certificate,
      });
    }

    // Update bucket deployment to include CloudFront invalidation if deployment is enabled
    if (this.node.tryGetContext('buildPath') && this.websiteBucket.deployment) {
      // Add CloudFront distribution to the deployment for cache invalidation
      const deployment = this.websiteBucket.deployment;
      deployment.node.addDependency(this.cloudFrontDistribution.distribution);
    }

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      description: 'Name of the S3 bucket for website content',
      value: this.websiteBucket.bucket.bucketName,
      exportName: `${this.stackName}-WebsiteBucketName`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      description: 'CloudFront distribution ID',
      value: this.cloudFrontDistribution.distribution.distributionId,
      exportName: `${this.stackName}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      description: 'CloudFront distribution domain name',
      value: this.cloudFrontDistribution.distribution.distributionDomainName,
      exportName: `${this.stackName}-CloudFrontDomainName`,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      description: 'Wedding website URL',
      value: props?.dnsConfig?.domainName
        ? `https://${props.dnsConfig.domainName}`
        : `https://${this.cloudFrontDistribution.distribution.distributionDomainName}`,
      exportName: `${this.stackName}-WebsiteURL`,
    });

    // Add custom domain output if configured
    if (props?.dnsConfig?.domainName) {
      new cdk.CfnOutput(this, 'CustomDomain', {
        description: 'Custom domain for the wedding website',
        value: props.dnsConfig.domainName,
        exportName: `${this.stackName}-CustomDomain`,
      });
    }

    new cdk.CfnOutput(this, 'CloudFrontLogsBucket', {
      description: 'S3 bucket for CloudFront access logs',
      value: this.cloudFrontDistribution.logsBucket.bucketName,
      exportName: `${this.stackName}-CloudFrontLogsBucket`,
    });

    // Photo Gallery Outputs
    new cdk.CfnOutput(this, 'PhotoGalleryBucketName', {
      description: 'S3 bucket for photo gallery',
      value: this.photoGalleryBucket.bucket.bucketName,
      exportName: `${this.stackName}-PhotoGalleryBucketName`,
    });

    new cdk.CfnOutput(this, 'PhotoGalleryCDNDomain', {
      description: 'CloudFront domain for photo gallery',
      value: this.photoGalleryCloudFront.distributionDomainName,
      exportName: `${this.stackName}-PhotoGalleryCDNDomain`,
    });

    new cdk.CfnOutput(this, 'PhotoGalleryURL', {
      description: 'Photo gallery CDN URL',
      value: `https://${this.photoGalleryCloudFront.distributionDomainName}`,
      exportName: `${this.stackName}-PhotoGalleryURL`,
    });

    // Add stack-level tags
    cdk.Tags.of(this).add('Project', 'WeddingWebsite');
    cdk.Tags.of(this).add('Environment', this.getEnvironment());
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }

  /**
   * Get removal policy based on environment
   */
  private getRemovalPolicy(): cdk.RemovalPolicy {
    const environment = this.getEnvironment();

    // Use RETAIN for production, DESTROY for development/testing
    if (environment === 'prod' || environment === 'production') {
      return cdk.RemovalPolicy.RETAIN;
    }

    return cdk.RemovalPolicy.DESTROY;
  }

  /**
   * Get environment from context or default to 'dev'
   */
  private getEnvironment(): string {
    return this.node.tryGetContext('environment') || 'dev';
  }
}
