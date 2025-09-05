import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface DnsConfig {
  /**
   * The domain name for the website (e.g., 'wedding.youngmonk.dev')
   */
  domainName: string;

  /**
   * The ID of the existing Route 53 hosted zone
   */
  hostedZoneId: string;

  /**
   * Optional certificate ARN. If not provided, a new certificate will be created
   */
  certificateArn?: string;

  /**
   * Whether to create a www subdomain that redirects to the apex domain
   * @default false
   */
  includeWww?: boolean;
}

export interface DnsSetupProps {
  /**
   * DNS configuration
   */
  dnsConfig: DnsConfig;

  /**
   * The CloudFront distribution to set up DNS for
   */
  distribution: cloudfront.Distribution;

  /**
   * Optional certificate if already created (to avoid duplication)
   */
  existingCertificate?: acm.ICertificate;
}

export class DnsSetup extends Construct {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.ICertificate;
  public readonly aRecord: route53.ARecord;
  public readonly aaaaRecord: route53.AaaaRecord;

  constructor(scope: Construct, id: string, props: DnsSetupProps) {
    super(scope, id);

    const { dnsConfig, distribution } = props;

    // Import the existing hosted zone
    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: dnsConfig.hostedZoneId,
      zoneName: dnsConfig.domainName.split('.').slice(-2).join('.'), // Extract base domain
    });

    // Use existing certificate if provided, otherwise handle creation/import
    if (props.existingCertificate) {
      this.certificate = props.existingCertificate;
    } else if (dnsConfig.certificateArn) {
      this.certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        dnsConfig.certificateArn
      );
    } else {
      // Create a new certificate with DNS validation
      this.certificate = new acm.Certificate(this, 'Certificate', {
        domainName: dnsConfig.domainName,
        subjectAlternativeNames: dnsConfig.includeWww ? [`www.${dnsConfig.domainName}`] : undefined,
        validation: acm.CertificateValidation.fromDns(this.hostedZone),
      });
    }

    // Create A record for IPv4
    this.aRecord = new route53.ARecord(this, 'ARecord', {
      zone: this.hostedZone,
      recordName: dnsConfig.domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      comment: 'Wedding website CloudFront distribution',
    });

    // Create AAAA record for IPv6
    this.aaaaRecord = new route53.AaaaRecord(this, 'AAAARecord', {
      zone: this.hostedZone,
      recordName: dnsConfig.domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      comment: 'Wedding website CloudFront distribution (IPv6)',
    });

    // Optionally create www subdomain records
    if (dnsConfig.includeWww) {
      new route53.ARecord(this, 'WwwARecord', {
        zone: this.hostedZone,
        recordName: `www.${dnsConfig.domainName}`,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
        comment: 'Wedding website www subdomain',
      });

      new route53.AaaaRecord(this, 'WwwAAAARecord', {
        zone: this.hostedZone,
        recordName: `www.${dnsConfig.domainName}`,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
        comment: 'Wedding website www subdomain (IPv6)',
      });
    }

    // Add tags
    cdk.Tags.of(this).add('Purpose', 'DNS');
    cdk.Tags.of(this).add('Domain', dnsConfig.domainName);
  }
}
