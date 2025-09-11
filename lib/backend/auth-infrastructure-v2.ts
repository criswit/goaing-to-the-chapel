import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { JWTKeyProvider } from './jwt-key-provider';

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
 * Version 2: Only creates keys if they don't exist, preserves existing keys
 */
export class AuthInfrastructureV2 extends Construct {
  public readonly jwtPrivateKeyParameter: ssm.IStringParameter;
  public readonly jwtPublicKeyParameter: ssm.IStringParameter;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props?: AuthInfrastructureProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';

    // Create KMS key for parameter encryption
    this.kmsKey = new kms.Key(this, 'AuthParameterKey', {
      description: `KMS key for encrypting JWT signing keys - ${environment}`,
      enableKeyRotation: true,
      alias: `alias/wedding-rsvp-auth-${environment}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep keys on stack deletion
    });

    // Use the JWT key provider that only creates keys if they don't exist
    const keyProvider = new JWTKeyProvider(this, 'JWTKeyProvider', {
      environment,
    });

    this.jwtPrivateKeyParameter = keyProvider.privateKeyParameter;
    this.jwtPublicKeyParameter = keyProvider.publicKeyParameter;

    // Store additional auth configuration
    new ssm.StringParameter(this, 'JWTConfig', {
      parameterName: `/wedding-rsvp/${environment}/jwt/config`,
      stringValue: JSON.stringify({
        algorithm: 'RS256',
        expiresIn: '8h', // Match the admin token expiry
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

    // Grant KMS decrypt for SecureString parameters
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
      privateKeyArn: `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${this.jwtPrivateKeyParameter.parameterName}`,
      publicKeyArn: `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${this.jwtPublicKeyParameter.parameterName}`,
    };
  }
}
