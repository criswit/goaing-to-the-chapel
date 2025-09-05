#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { WeddingWebsiteCdkStack } from '../lib/wedding-website-cdk-stack';
import { DnsConfig } from '../lib/dns-config';

const app = new cdk.App();

// Get environment from context or default to 'development'
const environment = app.node.tryGetContext('environment') || 'development';

// Load DNS configuration if available
let dnsConfig: DnsConfig | undefined;
const dnsConfigPath = path.join(__dirname, '..', 'config', 'dns.json');

if (fs.existsSync(dnsConfigPath)) {
  try {
    const dnsConfigFile = JSON.parse(fs.readFileSync(dnsConfigPath, 'utf8'));
    const envConfig = dnsConfigFile[environment];

    if (envConfig && envConfig.enabled !== false) {
      dnsConfig = {
        domainName: envConfig.domainName,
        hostedZoneId: envConfig.hostedZoneId,
        certificateArn: envConfig.certificateArn,
        includeWww: envConfig.includeWww || false,
      };

      console.log(`Loading DNS configuration for ${environment}:`, {
        domainName: dnsConfig.domainName,
        hostedZoneId: dnsConfig.hostedZoneId,
        includeWww: dnsConfig.includeWww,
      });
    } else {
      console.log(`DNS configuration disabled for ${environment}`);
    }
  } catch (error) {
    console.warn('Failed to load DNS configuration:', error);
  }
} else {
  console.log('No DNS configuration file found at:', dnsConfigPath);
}

new WeddingWebsiteCdkStack(app, 'WeddingWebsiteCdkStack', {
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
