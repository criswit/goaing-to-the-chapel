import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IAuthInfrastructure } from './auth-infrastructure-interface';

export interface AuthInfrastructureProps {
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  environment?: string;

  /**
   * Lambda functions that need access to the keys
   */
  lambdaFunctions?: iam.IGrantable[];

  /**
   * Force regeneration of keys even if they exist
   * @default false
   */
  forceRegenerate?: boolean;
}

/**
 * Simple version: Just reference existing SSM parameters
 * Keys must be created manually or through a separate process
 */
export class AuthInfrastructureSimple extends Construct implements IAuthInfrastructure {
  public readonly jwtPrivateKeyParameter: ssm.IStringParameter;
  public readonly jwtPublicKeyParameter: ssm.IStringParameter;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props?: AuthInfrastructureProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';

    // Create KMS key for parameter encryption (if using SecureString)
    this.kmsKey = new kms.Key(this, 'AuthParameterKey', {
      description: `KMS key for encrypting JWT signing keys - ${environment}`,
      enableKeyRotation: true,
      alias: `alias/wedding-rsvp-auth-${environment}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Simply reference existing parameters - don't create them
    // This assumes keys are already in SSM (created manually or by scripts)
    // Private key is stored as SecureString, so use fromSecureStringParameterAttributes
    this.jwtPrivateKeyParameter = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      'JWTPrivateKey',
      {
        parameterName: `/wedding-rsvp/${environment}/jwt/private-key`,
        version: 1,
      }
    );

    this.jwtPublicKeyParameter = ssm.StringParameter.fromStringParameterName(
      this,
      'JWTPublicKey',
      `/wedding-rsvp/${environment}/jwt/public-key`
    );

    // Store additional auth configuration (this can be created/updated)
    new ssm.StringParameter(this, 'JWTConfig', {
      parameterName: `/wedding-rsvp/${environment}/jwt/config`,
      stringValue: JSON.stringify({
        algorithm: 'RS256',
        expiresIn: '8h',
        issuer: 'wedding-rsvp-admin',
        audience: 'wedding-admin-dashboard',
      }),
      description: 'JWT configuration settings',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Grant Lambda functions access to parameters
    if (props?.lambdaFunctions) {
      props.lambdaFunctions.forEach((fn) => {
        this.grantParameterAccess(fn);
      });
    }

    // Add tags
    cdk.Tags.of(this).add('Component', 'Auth-Infrastructure');
    cdk.Tags.of(this).add('Environment', environment);
  }

  /**
   * Grant a Lambda function access to the JWT parameters
   */
  public grantParameterAccess(grantee: iam.IGrantable): void {
    // Grant read access to parameters
    grantee.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/wedding-rsvp/*/jwt/*`,
        ],
      })
    );

    // Grant KMS decrypt
    this.kmsKey.grantDecrypt(grantee);
  }

  /**
   * Compatibility methods for AuthInfrastructure interface
   */
  public get keyRotationSchedule(): string {
    return '90 days'; // Not used in simple version
  }

  private generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    throw new Error('Key generation not supported in simple version - use init-jwt-keys.js script');
  }

  public getParameterArns(): { privateKeyArn: string; publicKeyArn: string } {
    return {
      privateKeyArn: `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${this.jwtPrivateKeyParameter.parameterName}`,
      publicKeyArn: `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${this.jwtPublicKeyParameter.parameterName}`,
    };
  }

  public createParameterAccessPolicy(): iam.PolicyStatement {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/wedding-rsvp/*/jwt/*`,
      ],
    });
  }

  public createKMSAccessPolicy(): iam.PolicyStatement {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['kms:Decrypt', 'kms:DescribeKey'],
      resources: [this.kmsKey.keyArn],
    });
  }
}
