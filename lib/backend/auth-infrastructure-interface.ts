import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Common interface for auth infrastructure implementations
 */
export interface IAuthInfrastructure {
  readonly jwtPrivateKeyParameter: ssm.IStringParameter;
  readonly jwtPublicKeyParameter: ssm.IStringParameter;
  readonly kmsKey: kms.IKey;

  grantParameterAccess(grantee: iam.IGrantable): void;
  getParameterArns(): { privateKeyArn: string; publicKeyArn: string };
  createParameterAccessPolicy(): iam.PolicyStatement;
  createKMSAccessPolicy(): iam.PolicyStatement;
}
