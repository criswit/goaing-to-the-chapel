import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * Custom resource provider for JWT key management
 * Only generates new keys if they don't already exist in SSM
 */
export class JWTKeyProvider extends Construct {
  public readonly privateKeyParameter: ssm.IStringParameter;
  public readonly publicKeyParameter: ssm.IStringParameter;

  constructor(scope: Construct, id: string, props: { environment: string }) {
    super(scope, id);

    const { environment } = props;

    // Create Lambda function for key management
    const keyManagerFunction = new lambda.Function(this, 'KeyManager', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
        const { SSMClient, GetParameterCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
        const crypto = require('crypto');
        
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
          
          const privateKeyName = event.ResourceProperties.PrivateKeyName;
          const publicKeyName = event.ResourceProperties.PublicKeyName;
          
          if (event.RequestType === 'Delete') {
            // Don't delete keys on stack deletion - preserve them
            return { PhysicalResourceId: 'jwt-keys' };
          }
          
          try {
            // Check if keys already exist
            const [privateKeyExists, publicKeyExists] = await Promise.all([
              ssmClient.send(new GetParameterCommand({ Name: privateKeyName }))
                .then(() => true)
                .catch(() => false),
              ssmClient.send(new GetParameterCommand({ Name: publicKeyName }))
                .then(() => true)
                .catch(() => false)
            ]);
            
            if (privateKeyExists && publicKeyExists) {
              console.log('Keys already exist, skipping generation');
              return { PhysicalResourceId: 'jwt-keys' };
            }
            
            // Generate new keys only if they don't exist
            console.log('Generating new JWT key pair');
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
              modulusLength: 2048,
              publicKeyEncoding: { type: 'spki', format: 'pem' },
              privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            
            // Store keys in SSM
            await Promise.all([
              ssmClient.send(new PutParameterCommand({
                Name: privateKeyName,
                Value: privateKey,
                Type: 'SecureString',
                Overwrite: false, // Don't overwrite if exists
                Description: 'RSA private key for JWT signing (RS256)'
              })),
              ssmClient.send(new PutParameterCommand({
                Name: publicKeyName,
                Value: publicKey,
                Type: 'String',
                Overwrite: false, // Don't overwrite if exists
                Description: 'RSA public key for JWT verification (RS256)'
              }))
            ]);
            
            console.log('Successfully created JWT keys');
            return { PhysicalResourceId: 'jwt-keys' };
            
          } catch (error) {
            console.error('Error managing keys:', error);
            throw error;
          }
        };
      `),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
    });

    // Grant SSM permissions
    keyManagerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:PutParameter', 'ssm:DescribeParameters'],
        resources: [
          `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/wedding-rsvp/${environment}/jwt/*`,
        ],
      })
    );

    // Grant KMS permissions for SecureString
    keyManagerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'], // Use default KMS key
      })
    );

    // Create custom resource
    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: keyManagerFunction,
    });

    new cdk.CustomResource(this, 'JWTKeys', {
      serviceToken: provider.serviceToken,
      properties: {
        PrivateKeyName: `/wedding-rsvp/${environment}/jwt/private-key`,
        PublicKeyName: `/wedding-rsvp/${environment}/jwt/public-key`,
        // Add a version to force update if needed
        Version: '1.0.0',
      },
    });

    // Reference the existing parameters (they'll be created by the custom resource if needed)
    this.privateKeyParameter = ssm.StringParameter.fromStringParameterName(
      this,
      'PrivateKeyParam',
      `/wedding-rsvp/${environment}/jwt/private-key`
    );

    this.publicKeyParameter = ssm.StringParameter.fromStringParameterName(
      this,
      'PublicKeyParam',
      `/wedding-rsvp/${environment}/jwt/public-key`
    );
  }
}
