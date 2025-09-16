import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { PhotoGalleryBucket } from './photo-gallery-bucket';

export interface PhotoGalleryCloudFrontProps {
  /**
   * The S3 bucket containing the photo gallery
   */
  photoBucket: PhotoGalleryBucket;

  /**
   * Custom domain name for the distribution
   */
  domainName?: string;

  /**
   * Certificate for the custom domain
   */
  certificate?: acm.ICertificate;

  /**
   * Alternative domain names for the distribution
   */
  alternativeDomainNames?: string[];

  /**
   * Price class for cost optimization
   * @default PRICE_CLASS_100
   */
  priceClass?: cloudfront.PriceClass;
}

export class PhotoGalleryCloudFront extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: PhotoGalleryCloudFrontProps) {
    super(scope, id);

    // Create Response Headers Policy for security and caching
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'PhotoGalleryHeadersPolicy',
      {
        comment: 'Headers policy for photo gallery CDN',
        corsBehavior: {
          accessControlAllowCredentials: false,
          accessControlAllowHeaders: ['*'],
          accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
          accessControlAllowOrigins: [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://wedding.himnher.dev',
            'https://www.wedding.himnher.dev',
          ],
          accessControlMaxAge: cdk.Duration.seconds(86400),
          originOverride: true,
        },
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.seconds(31536000),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
              override: false,
            },
          ],
        },
      }
    );

    // Create cache policy for thumbnails (long TTL, optimized for small images)
    const thumbnailCachePolicy = new cloudfront.CachePolicy(this, 'ThumbnailCachePolicy', {
      comment: 'Cache policy for photo thumbnails with long TTL',
      defaultTtl: cdk.Duration.days(90),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.days(30),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Create cache policy for full-size images (medium TTL, balance between freshness and performance)
    const fullImageCachePolicy = new cloudfront.CachePolicy(this, 'FullImageCachePolicy', {
      comment: 'Cache policy for full-size photos with medium TTL',
      defaultTtl: cdk.Duration.days(30),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.days(7),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Prepare domain configuration
    const domainNames: string[] = [];
    if (props.domainName) {
      domainNames.push(props.domainName);
    }
    if (props.alternativeDomainNames) {
      domainNames.push(...props.alternativeDomainNames);
    }

    // Create a single S3 origin with access control
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(props.photoBucket.bucket);

    // Create CloudFront distribution for photo gallery
    this.distribution = new cloudfront.Distribution(this, 'PhotoGalleryDistribution', {
      comment: 'CloudFront distribution for wedding photo gallery',

      // Configure custom domain if provided
      ...(domainNames.length > 0 && {
        domainNames: domainNames,
        certificate: props.certificate,
      }),

      // Default behavior for all photos
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: fullImageCachePolicy,
        responseHeadersPolicy: responseHeadersPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
      },

      // Additional cache behaviors for different photo types
      additionalBehaviors: {
        // Thumbnails - longer cache duration
        '*/thumbnails/*': {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: thumbnailCachePolicy,
          responseHeadersPolicy: responseHeadersPolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
        },

        // Full-size images - medium cache duration
        '*/full/*': {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: fullImageCachePolicy,
          responseHeadersPolicy: responseHeadersPolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
        },
      },

      // No custom error pages needed - let CloudFront handle defaults

      // Security settings
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

      // Price class for cost optimization
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_100,

      // Enable IPv6
      enableIpv6: true,

      // Enable logging (optional - can be configured later)
      enableLogging: false,
    });

    // Store the distribution domain name
    this.distributionDomainName = this.distribution.distributionDomainName;

    // Add tags
    cdk.Tags.of(this.distribution).add('Project', 'WeddingWebsite');
    cdk.Tags.of(this.distribution).add('Component', 'PhotoGallery');
    cdk.Tags.of(this.distribution).add('Environment', 'Production');

    // Create outputs
    this.createOutputs();
  }

  /**
   * Create CloudFormation outputs for distribution information
   */
  private createOutputs(): void {
    // Outputs are created at the stack level to avoid duplicates
    // These are kept commented for reference of available values
    // new cdk.CfnOutput(this, 'PhotoGalleryDistributionId', {
    //   value: this.distribution.distributionId,
    //   description: 'CloudFront distribution ID for photo gallery',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryDistributionId`,
    // });
    // new cdk.CfnOutput(this, 'PhotoGalleryDistributionDomainName', {
    //   value: this.distributionDomainName,
    //   description: 'CloudFront distribution domain name for photo gallery',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryDistributionDomainName`,
    // });
    // new cdk.CfnOutput(this, 'PhotoGalleryCloudFrontUrl', {
    //   value: `https://${this.distributionDomainName}`,
    //   description: 'Full CloudFront URL for photo gallery',
    //   exportName: `${cdk.Stack.of(this).stackName}-PhotoGalleryCloudFrontUrl`,
    // });
  }

  /**
   * Get the full CloudFront URL for a specific photo path
   */
  public getPhotoUrl(path: string): string {
    return `https://${this.distributionDomainName}/${path}`;
  }
}
