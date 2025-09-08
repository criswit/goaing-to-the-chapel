import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface ApiDomainConfigProps {
  /**
   * The API Gateway REST API to configure
   */
  api: apigateway.RestApi;

  /**
   * The domain name for the API (e.g., 'api.wedding.himnher.dev')
   */
  domainName: string;

  /**
   * The Route53 hosted zone for the domain
   */
  hostedZone?: route53.IHostedZone;

  /**
   * The ACM certificate for the domain (will be created if not provided)
   */
  certificate?: acm.ICertificate;

  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;
}

/**
 * Configures a custom domain name for the API Gateway
 */
export class ApiDomainConfig extends Construct {
  public readonly domainName: apigateway.DomainName;
  public readonly certificate: acm.ICertificate;
  public readonly aRecord?: route53.ARecord;

  constructor(scope: Construct, id: string, props: ApiDomainConfigProps) {
    super(scope, id);

    const environment = props.environment || 'dev';

    // If no hosted zone provided, try to lookup or create one
    const hostedZone = props.hostedZone || this.getOrCreateHostedZone();

    // Create or use provided certificate
    this.certificate =
      props.certificate ||
      new acm.Certificate(this, 'ApiCertificate', {
        domainName: props.domainName,
        certificateName: `wedding-api-cert-${environment}`,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

    // Create custom domain for API Gateway
    this.domainName = new apigateway.DomainName(this, 'ApiDomainName', {
      domainName: props.domainName,
      certificate: this.certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });

    // Create base path mapping
    new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
      domainName: this.domainName,
      restApi: props.api,
      basePath: '', // Map to root path
    });

    // Create Route53 A record if hosted zone is available
    if (hostedZone) {
      this.aRecord = new route53.ARecord(this, 'ApiAliasRecord', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53targets.ApiGatewayDomain(this.domainName)
        ),
        comment: `API Gateway domain for wedding RSVP API - ${environment}`,
      });
    }

    // Output the API domain
    new cdk.CfnOutput(this, 'ApiDomainUrl', {
      value: `https://${props.domainName}`,
      description: 'Custom domain URL for the RSVP API',
    });

    // Output the CloudFormation domain name (for debugging)
    new cdk.CfnOutput(this, 'ApiGatewayDomainName', {
      value: this.domainName.domainNameAliasDomainName,
      description: 'API Gateway domain name (CloudFront distribution)',
    });

    // Add tags
    cdk.Tags.of(this).add('Component', 'API-Domain');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Domain', props.domainName);
  }

  /**
   * Helper to get the hosted zone for wedding.himnher.dev
   */
  private getOrCreateHostedZone(): route53.IHostedZone {
    // Use the known hosted zone for wedding.himnher.dev
    return route53.HostedZone.fromHostedZoneAttributes(this, 'WeddingHostedZone', {
      hostedZoneId: 'Z08237002D3AKVKPC3U13',
      zoneName: 'wedding.himnher.dev',
    });
  }
}

/**
 * Configuration for multi-environment API domains
 */
export interface MultiEnvironmentApiDomainProps {
  /**
   * Base domain (e.g., 'himnher.dev')
   */
  baseDomain: string;

  /**
   * Subdomain pattern (e.g., 'api.wedding' will create 'api.wedding.himnher.dev')
   */
  subdomain: string;

  /**
   * Environment-specific subdomain (e.g., 'dev', 'staging', 'prod')
   * If provided, creates 'api-dev.wedding.himnher.dev'
   */
  environmentSubdomain?: string;

  /**
   * Whether to use environment-specific subdomains
   * @default false
   */
  useEnvironmentSubdomain?: boolean;
}

/**
 * Helper to build API domain names for different environments
 */
export class ApiDomainHelper {
  /**
   * Build the full domain name for the API
   */
  static buildApiDomain(props: MultiEnvironmentApiDomainProps): string {
    if (props.useEnvironmentSubdomain && props.environmentSubdomain) {
      // Pattern: api-dev.wedding.himnher.dev
      return `${props.subdomain}-${props.environmentSubdomain}.${props.baseDomain}`;
    } else {
      // Pattern: api.wedding.himnher.dev
      return `${props.subdomain}.${props.baseDomain}`;
    }
  }

  /**
   * Get domain configuration - always returns production config
   */
  static getEnvironmentConfig(): MultiEnvironmentApiDomainProps {
    // Single production configuration - no environment variations
    return {
      baseDomain: 'wedding.himnher.dev',
      subdomain: 'api',
      useEnvironmentSubdomain: false,
    };
  }
}
