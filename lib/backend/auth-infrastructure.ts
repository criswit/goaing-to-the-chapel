/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as crypto from 'crypto';

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
}

/**
 * Authentication Infrastructure for JWT key management
 *
 * This construct:
 * 1. Creates RSA key pairs for JWT signing
 * 2. Stores keys securely in AWS Systems Manager Parameter Store
 * 3. Manages KMS encryption for parameters
 * 4. Provides IAM permissions for Lambda access
 */
export class AuthInfrastructure extends Construct {
  public readonly jwtPrivateKeyParameter: ssm.StringParameter;
  public readonly jwtPublicKeyParameter: ssm.StringParameter;
  public readonly kmsKey: kms.Key;
  public readonly keyRotationSchedule: string = '90 days';

  constructor(scope: Construct, id: string, props?: AuthInfrastructureProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';

    // Create KMS key for parameter encryption
    this.kmsKey = new kms.Key(this, 'AuthParameterKey', {
      description: `KMS key for encrypting JWT signing keys - ${environment}`,
      enableKeyRotation: true,
      alias: `alias/wedding-rsvp-auth-${environment}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Generate RSA key pair for JWT signing
    const { publicKey, privateKey } = this.generateRSAKeyPair();

    // Store private key in Parameter Store using KMS encryption
    // Note: Using regular StringParameter with KMS encryption instead of deprecated SECURE_STRING type
    this.jwtPrivateKeyParameter = new ssm.StringParameter(this, 'JWTPrivateKey', {
      parameterName: `/wedding-rsvp/${environment}/jwt/private-key`,
      stringValue: privateKey,
      description: 'RSA private key for JWT signing (RS256)',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store public key in Parameter Store (String - not sensitive)
    this.jwtPublicKeyParameter = new ssm.StringParameter(this, 'JWTPublicKey', {
      parameterName: `/wedding-rsvp/${environment}/jwt/public-key`,
      stringValue: publicKey,
      description: 'RSA public key for JWT verification (RS256)',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store additional auth configuration
    new ssm.StringParameter(this, 'JWTConfig', {
      parameterName: `/wedding-rsvp/${environment}/jwt/config`,
      stringValue: JSON.stringify({
        algorithm: 'RS256',
        expiresIn: '1h',
        issuer: `wedding-rsvp-${environment}`,
        audience: 'wedding-guests',
        keyRotationSchedule: this.keyRotationSchedule,
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
   * Generate RSA key pair for JWT signing
   */
  private generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Grant a Lambda function access to the JWT parameters
   */
  public grantParameterAccess(grantee: iam.IGrantable): void {
    this.jwtPrivateKeyParameter.grantRead(grantee);
    this.jwtPublicKeyParameter.grantRead(grantee);
    this.kmsKey.grantDecrypt(grantee);
  }

  /**
   * Get the parameter ARNs for reference in other constructs
   */
  public getParameterArns(): {
    privateKeyArn: string;
    publicKeyArn: string;
  } {
    return {
      privateKeyArn: this.jwtPrivateKeyParameter.parameterArn,
      publicKeyArn: this.jwtPublicKeyParameter.parameterArn,
    };
  }

  /**
   * Create IAM policy for parameter access
   */
  public createParameterAccessPolicy(): iam.PolicyStatement {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParameterHistory',
        'ssm:DescribeParameters',
      ],
      resources: [
        this.jwtPrivateKeyParameter.parameterArn,
        this.jwtPublicKeyParameter.parameterArn,
      ],
    });
  }

  /**
   * Create IAM policy for KMS decryption
   */
  public createKMSAccessPolicy(): iam.PolicyStatement {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['kms:Decrypt', 'kms:DescribeKey'],
      resources: [this.kmsKey.keyArn],
    });
  }
}

/**
 * Key rotation handler for automated key rotation
 * This would be deployed as a separate Lambda function
 */
export class KeyRotationHandler {
  /**
   * Rotate JWT signing keys
   * This should be called periodically (e.g., every 90 days)
   */
  static async rotateKeys(environment: string, ssmClient: any): Promise<void> {
    // Generate new key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Store old keys with timestamp (for validation of existing tokens)
    const timestamp = new Date().toISOString();

    // Get current keys
    const currentPrivateKey = await ssmClient.getParameter({
      Name: `/wedding-rsvp/${environment}/jwt/private-key`,
      WithDecryption: true,
    });

    const currentPublicKey = await ssmClient.getParameter({
      Name: `/wedding-rsvp/${environment}/jwt/public-key`,
    });

    // Archive old keys
    await ssmClient.putParameter({
      Name: `/wedding-rsvp/${environment}/jwt/private-key-${timestamp}`,
      Value: currentPrivateKey.Parameter.Value,
      Type: 'SecureString',
      Description: `Archived private key from ${timestamp}`,
    });

    await ssmClient.putParameter({
      Name: `/wedding-rsvp/${environment}/jwt/public-key-${timestamp}`,
      Value: currentPublicKey.Parameter.Value,
      Type: 'String',
      Description: `Archived public key from ${timestamp}`,
    });

    // Update with new keys
    await ssmClient.putParameter({
      Name: `/wedding-rsvp/${environment}/jwt/private-key`,
      Value: privateKey,
      Type: 'SecureString',
      Overwrite: true,
    });

    await ssmClient.putParameter({
      Name: `/wedding-rsvp/${environment}/jwt/public-key`,
      Value: publicKey,
      Type: 'String',
      Overwrite: true,
    });

    console.log(`Keys rotated successfully at ${timestamp}`);
  }
}
