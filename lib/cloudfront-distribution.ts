import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CloudFrontDistributionProps {
  /**
   * The S3 bucket containing the website content
   */
  websiteBucket: s3.IBucket;

  /**
   * Enable geo restrictions
   * @default false
   */
  enableGeoRestrictions?: boolean;

  /**
   * List of allowed countries (ISO 3166-1 alpha-2 codes)
   * Only used if enableGeoRestrictions is true
   */
  allowedCountries?: string[];

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
}

export class CloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CloudFrontDistributionProps) {
    super(scope, id);

    // Create logs bucket
    this.logsBucket = new s3.Bucket(this, 'CloudFrontLogsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // CloudFront requires ACLs to be enabled for logging
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false, // CloudFront needs to write ACLs
        ignorePublicAcls: false,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      }),
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Grant CloudFront permission to write logs
    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontLogDelivery',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${this.logsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Stack.of(this).account,
          },
        },
      })
    );

    // Grant CloudFront permission to check bucket ACL
    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:PutBucketAcl'],
        resources: [this.logsBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Stack.of(this).account,
          },
        },
      })
    );

    // Create Response Headers Policy for security
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeadersPolicy',
      {
        comment: 'Security headers policy for wedding website',
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
      }
    );

    // Configure geo restrictions if enabled
    let geoRestriction: cloudfront.GeoRestriction | undefined;
    if (props.enableGeoRestrictions && props.allowedCountries) {
      geoRestriction = cloudfront.GeoRestriction.allowlist(...props.allowedCountries);
    }

    // Prepare domain configuration
    const domainNames: string[] = [];
    if (props.domainName) {
      domainNames.push(props.domainName);
    }
    if (props.alternativeDomainNames) {
      domainNames.push(...props.alternativeDomainNames);
    }

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'CloudFront distribution for wedding website',

      // Configure custom domain if provided
      ...(domainNames.length > 0 && {
        domainNames: domainNames,
        certificate: props.certificate,
      }),

      // Default behavior for HTML files and SPA routing
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(props.websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: responseHeadersPolicy,

        // Allowed HTTP methods for SPA
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,

        // Compress content
        compress: true,
      },

      // Additional cache behaviors for different content types
      additionalBehaviors: {
        // Static assets - longer cache duration
        '/static/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(props.websiteBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'StaticAssetsCachePolicy', {
            comment: 'Cache policy for static assets with long TTL',
            defaultTtl: cdk.Duration.days(30),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),
            cookieBehavior: cloudfront.CacheCookieBehavior.none(),
            headerBehavior: cloudfront.CacheHeaderBehavior.none(),
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          responseHeadersPolicy: responseHeadersPolicy,
          compress: true,
        },

        // Images - medium cache duration
        '/images/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(props.websiteBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'ImagesCachePolicy', {
            comment: 'Cache policy for images',
            defaultTtl: cdk.Duration.days(7),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),
            cookieBehavior: cloudfront.CacheCookieBehavior.none(),
            headerBehavior: cloudfront.CacheHeaderBehavior.none(),
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          responseHeadersPolicy: responseHeadersPolicy,
          compress: true,
        },
      },

      // SPA routing - return index.html for 404s
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],

      // Default root object
      defaultRootObject: 'index.html',

      // Security settings
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

      // Geo restrictions
      geoRestriction: geoRestriction,

      // Access logging
      enableLogging: true,
      logBucket: this.logsBucket,
      logFilePrefix: 'access-logs/',
      logIncludesCookies: false,

      // Price class for cost optimization
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,

      // Enable IPv6
      enableIpv6: true,
    });

    // Add tags
    cdk.Tags.of(this.distribution).add('Project', 'WeddingWebsite');
    cdk.Tags.of(this.distribution).add('Environment', 'Production');
    cdk.Tags.of(this.logsBucket).add('Project', 'WeddingWebsite');
    cdk.Tags.of(this.logsBucket).add('Purpose', 'CloudFrontLogs');
  }
}
