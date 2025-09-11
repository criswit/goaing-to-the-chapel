#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { WeddingWebsiteCdkStack } from '../lib/wedding-website-cdk-stack';
import { RsvpBackendStack } from '../lib/rsvp-backend-stack';
import { DnsConfig } from '../lib/dns-config';

const app = new cdk.App();

// Load DNS configuration
let dnsConfig: DnsConfig | undefined;
const dnsConfigPath = path.join(__dirname, '..', 'config', 'dns.json');

if (fs.existsSync(dnsConfigPath)) {
  try {
    const dnsConfigFile = JSON.parse(fs.readFileSync(dnsConfigPath, 'utf8'));
    const prodConfig = dnsConfigFile.production;

    if (prodConfig && prodConfig.enabled !== false) {
      dnsConfig = {
        domainName: prodConfig.domainName,
        hostedZoneId: prodConfig.hostedZoneId,
        certificateArn: prodConfig.certificateArn,
        includeWww: prodConfig.includeWww || false,
      };

      // eslint-disable-next-line no-console
      console.log('Loading DNS configuration:', {
        domainName: dnsConfig.domainName,
        hostedZoneId: dnsConfig.hostedZoneId,
        includeWww: dnsConfig.includeWww,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('DNS configuration is disabled');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load DNS configuration:', error);
  }
} else {
  // eslint-disable-next-line no-console
  console.log('No DNS configuration file found at:', dnsConfigPath);
}

// Deploy the website stack
const websiteStack = new WeddingWebsiteCdkStack(app, 'WeddingWebsiteCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  // For DNS and ACM certificate to work properly, we need to specify the region
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },

  // Pass DNS configuration if available
  dnsConfig: dnsConfig,

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Deploy the RSVP backend stack
const rsvpStack = new RsvpBackendStack(app, 'RsvpBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },

  // Pass domain name and hosted zone for CORS and SES configuration
  domainName: dnsConfig?.domainName,
  hostedZoneId: dnsConfig?.hostedZoneId,

  description: 'RSVP backend infrastructure for wedding website',
});

// Add dependency - backend can be deployed independently but if both are deployed,
// website should be deployed first
rsvpStack.addDependency(websiteStack);
