import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface EmailInfrastructureProps {
  /**
   * The domain name to verify for SES
   */
  domainName: string;

  /**
   * The hosted zone for the domain (optional)
   */
  hostedZone?: route53.IHostedZone;

  /**
   * Environment name for resource naming
   */
  environment: string;

  /**
   * Email address to send notifications to
   */
  notificationEmail?: string;

  /**
   * Additional email addresses to verify (for testing in sandbox mode)
   */
  verifyEmails?: string[];

  /**
   * Personal email to forward incoming emails to (optional)
   */
  forwardToEmail?: string;
}

export class EmailInfrastructure extends Construct {
  /**
   * The verified domain identity for SES
   */
  public readonly domainIdentity: ses.EmailIdentity;

  /**
   * SNS topic for bounce notifications
   */
  public readonly bounceNotificationTopic: sns.Topic;

  /**
   * SNS topic for complaint notifications
   */
  public readonly complaintNotificationTopic: sns.Topic;

  /**
   * SQS queue for processing bounce notifications
   */
  public readonly bounceQueue: sqs.Queue;

  /**
   * SQS queue for processing complaint notifications
   */
  public readonly complaintQueue: sqs.Queue;

  /**
   * Dead letter queue for failed bounce processing
   */
  public readonly bounceDLQ: sqs.Queue;

  /**
   * Dead letter queue for failed complaint processing
   */
  public readonly complaintDLQ: sqs.Queue;

  /**
   * SQS queue for email sending operations
   */
  public readonly emailQueue: sqs.Queue;

  /**
   * Dead letter queue for failed email sending
   */
  public readonly emailDLQ: sqs.Queue;

  /**
   * IAM role for Lambda functions to send emails
   */
  public readonly sesRole: iam.Role;

  /**
   * S3 bucket for storing received emails (optional)
   */
  public readonly emailBucket?: s3.Bucket;

  constructor(scope: Construct, id: string, props: EmailInfrastructureProps) {
    super(scope, id);

    // Create domain identity with DKIM enabled
    // If hosted zone is provided, pass it to automatically create DNS records
    this.domainIdentity = new ses.EmailIdentity(this, 'DomainIdentity', {
      identity: ses.Identity.domain(props.domainName),
      dkimSigning: true,
      feedbackForwarding: true,
      mailFromDomain: `mail.${props.domainName}`,
      mailFromBehaviorOnMxFailure: ses.MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE,
    });

    // If hosted zone is provided, manually add the DKIM records
    if (props.hostedZone && this.domainIdentity.dkimRecords) {
      const hostedZone = props.hostedZone; // TypeScript needs this for type narrowing

      this.domainIdentity.dkimRecords.forEach((dkimRecord, index) => {
        new route53.CnameRecord(this, `DkimCnameRecord${index}`, {
          zone: hostedZone,
          recordName: dkimRecord.name,
          domainName: dkimRecord.value,
          ttl: cdk.Duration.minutes(5),
          comment: `DKIM record ${index + 1} for SES domain verification`,
        });

        new cdk.CfnOutput(this, `DKIMRecordAdded${index + 1}`, {
          value: `${dkimRecord.name} -> ${dkimRecord.value}`,
          description: `DKIM CNAME Record ${index + 1} added to Route53`,
        });
      });

      // Add MX record for mail.domain (for Mail FROM)
      new route53.MxRecord(this, 'MailFromMxRecord', {
        zone: hostedZone,
        recordName: 'mail',
        values: [
          {
            priority: 10,
            hostName: `feedback-smtp.${cdk.Stack.of(this).region}.amazonses.com`,
          },
        ],
        ttl: cdk.Duration.minutes(5),
        comment: 'MX record for SES mail FROM domain',
      });

      // Add MX record for the main domain (for WorkMail)
      // This supports both SES receiving and WorkMail
      new route53.MxRecord(this, 'MainDomainMxRecord', {
        zone: hostedZone,
        recordName: '',
        values: [
          {
            priority: 10,
            hostName: `inbound-smtp.${cdk.Stack.of(this).region}.amazonaws.com`,
          },
        ],
        ttl: cdk.Duration.minutes(5),
        comment: 'MX record for WorkMail and SES email receiving',
      });

      // Add AutoDiscover CNAME record for WorkMail
      // NOTE: Commented out as this record already exists
      // new route53.CnameRecord(this, 'WorkMailAutoDiscoverRecord', {
      //   zone: hostedZone,
      //   recordName: 'autodiscover',
      //   domainName: `autodiscover.mail.${cdk.Stack.of(this).region}.awsapps.com`,
      //   ttl: cdk.Duration.minutes(5),
      //   comment: 'AutoDiscover record for WorkMail email client configuration',
      // });

      // Add SPF record for mail.domain
      new route53.TxtRecord(this, 'MailFromSpfRecord', {
        zone: hostedZone,
        recordName: 'mail',
        values: ['v=spf1 include:amazonses.com ~all'],
        ttl: cdk.Duration.minutes(5),
        comment: 'SPF record for SES mail FROM domain',
      });

      // Add SPF record for the main domain (includes both SES and WorkMail)
      new route53.TxtRecord(this, 'MainDomainSpfRecord', {
        zone: hostedZone,
        recordName: '',
        values: [
          `v=spf1 include:amazonses.com include:spf.mail.${cdk.Stack.of(this).region}.awsapps.com ~all`,
        ],
        ttl: cdk.Duration.minutes(5),
        comment: 'SPF record for main domain (SES and WorkMail)',
      });

      // Add DMARC record for email authentication
      // NOTE: Commented out as this record already exists
      // new route53.TxtRecord(this, 'DmarcRecord', {
      //   zone: hostedZone,
      //   recordName: '_dmarc',
      //   values: [`v=DMARC1; p=quarantine; rua=mailto:admin@${props.domainName}`],
      //   ttl: cdk.Duration.minutes(5),
      //   comment: 'DMARC record for email authentication',
      // });

      new cdk.CfnOutput(this, 'DomainVerificationStatus', {
        value: 'DKIM, MX, and SPF records have been added to Route53',
        description: 'SES Domain Verification Status',
      });
    }

    // Verify additional email addresses for testing (useful in sandbox mode)
    if (props.verifyEmails && props.verifyEmails.length > 0) {
      props.verifyEmails.forEach((email, index) => {
        new ses.EmailIdentity(this, `VerifiedEmail${index}`, {
          identity: ses.Identity.email(email),
        });

        new cdk.CfnOutput(this, `VerifiedEmailAddress${index}`, {
          value: email,
          description: `Verified Email Address ${index + 1}`,
        });
      });
    }

    // Also verify the notification email if provided
    if (props.notificationEmail) {
      new ses.EmailIdentity(this, 'NotificationEmailIdentity', {
        identity: ses.Identity.email(props.notificationEmail),
      });
    }

    // Create configuration set for tracking and reputation
    const configurationSet = new ses.ConfigurationSet(this, 'ConfigurationSet', {
      configurationSetName: `wedding-rsvp-${props.environment}`,
      sendingEnabled: true,
    });

    // Create SNS topics for notifications
    this.bounceNotificationTopic = new sns.Topic(this, 'BounceNotificationTopic', {
      topicName: `wedding-rsvp-bounce-notifications-${props.environment}`,
      displayName: 'Wedding RSVP Bounce Notifications',
    });

    this.complaintNotificationTopic = new sns.Topic(this, 'ComplaintNotificationTopic', {
      topicName: `wedding-rsvp-complaint-notifications-${props.environment}`,
      displayName: 'Wedding RSVP Complaint Notifications',
    });

    // Create dead letter queues
    this.bounceDLQ = new sqs.Queue(this, 'BounceDLQ', {
      queueName: `wedding-rsvp-bounce-dlq-${props.environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.complaintDLQ = new sqs.Queue(this, 'ComplaintDLQ', {
      queueName: `wedding-rsvp-complaint-dlq-${props.environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.emailDLQ = new sqs.Queue(this, 'EmailDLQ', {
      queueName: `wedding-rsvp-email-dlq-${props.environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create processing queues with dead letter queues
    this.bounceQueue = new sqs.Queue(this, 'BounceQueue', {
      queueName: `wedding-rsvp-bounce-queue-${props.environment}`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: this.bounceDLQ,
        maxReceiveCount: 3,
      },
    });

    this.complaintQueue = new sqs.Queue(this, 'ComplaintQueue', {
      queueName: `wedding-rsvp-complaint-queue-${props.environment}`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: this.complaintDLQ,
        maxReceiveCount: 3,
      },
    });

    // Create email sending queue with retry configuration
    this.emailQueue = new sqs.Queue(this, 'EmailQueue', {
      queueName: `wedding-rsvp-email-queue-${props.environment}`,
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes for processing
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: this.emailDLQ,
        maxReceiveCount: 5, // More retries for temporary failures
      },
    });

    // Subscribe queues to SNS topics
    this.bounceNotificationTopic.addSubscription(
      new snsSubscriptions.SqsSubscription(this.bounceQueue, {
        rawMessageDelivery: true,
      })
    );

    this.complaintNotificationTopic.addSubscription(
      new snsSubscriptions.SqsSubscription(this.complaintQueue, {
        rawMessageDelivery: true,
      })
    );

    // Add email notification if provided
    if (props.notificationEmail) {
      this.bounceNotificationTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.notificationEmail)
      );
      this.complaintNotificationTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Configure SES event destination for the configuration set
    new ses.ConfigurationSetEventDestination(this, 'BounceEventDestination', {
      configurationSet,
      destination: ses.EventDestination.snsTopic(this.bounceNotificationTopic),
      events: [ses.EmailSendingEvent.BOUNCE, ses.EmailSendingEvent.REJECT],
      configurationSetEventDestinationName: `bounce-destination-${props.environment}`,
    });

    new ses.ConfigurationSetEventDestination(this, 'ComplaintEventDestination', {
      configurationSet,
      destination: ses.EventDestination.snsTopic(this.complaintNotificationTopic),
      events: [ses.EmailSendingEvent.COMPLAINT],
      configurationSetEventDestinationName: `complaint-destination-${props.environment}`,
    });

    // Set up email receiving if domain is verified
    if (props.hostedZone) {
      // Create S3 bucket to store received emails
      this.emailBucket = new s3.Bucket(this, 'ReceivedEmailsBucket', {
        bucketName: `wedding-emails-${props.environment}-${cdk.Stack.of(this).account}`,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(30), // Auto-delete emails after 30 days
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      // Create receipt rule set (you may need to activate this manually in the console)
      const receiptRuleSet = new ses.ReceiptRuleSet(this, 'EmailReceiptRuleSet', {
        receiptRuleSetName: `wedding-email-rules-${props.environment}`,
      });

      // Create a receipt rule for admin@wedding.himnher.dev
      const adminEmailRule = new ses.ReceiptRule(this, 'AdminEmailRule', {
        ruleSet: receiptRuleSet,
        recipients: ['admin@wedding.himnher.dev', 'wedding@wedding.himnher.dev'],
        actions: [
          new sesActions.S3({
            bucket: this.emailBucket,
            objectKeyPrefix: 'incoming-emails/',
          }),
        ],
        enabled: true,
      });

      // If forwarding email is provided, also forward emails there
      if (props.forwardToEmail) {
        // Verify the forwarding email address
        new ses.EmailIdentity(this, 'ForwardingEmailIdentity', {
          identity: ses.Identity.email(props.forwardToEmail),
        });

        // Add SNS action to forward emails
        const forwardingTopic = new sns.Topic(this, 'EmailForwardingTopic', {
          topicName: `wedding-email-forwarding-${props.environment}`,
        });

        forwardingTopic.addSubscription(
          new snsSubscriptions.EmailSubscription(props.forwardToEmail)
        );

        adminEmailRule.addAction(
          new sesActions.Sns({
            topic: forwardingTopic,
          })
        );

        new cdk.CfnOutput(this, 'ForwardingEmail', {
          value: props.forwardToEmail,
          description: 'Emails are being forwarded to this address',
        });
      }

      // Grant SES permission to write to the S3 bucket
      this.emailBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          principals: [new iam.ServicePrincipal('ses.amazonaws.com')],
          actions: ['s3:PutObject'],
          resources: [`${this.emailBucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              'AWS:SourceAccount': cdk.Stack.of(this).account,
            },
          },
        })
      );

      new cdk.CfnOutput(this, 'EmailBucketName', {
        value: this.emailBucket.bucketName,
        description: 'S3 bucket storing received emails',
      });

      new cdk.CfnOutput(this, 'EmailReceivingActive', {
        value: 'true',
        description: 'Email receiving is configured for admin@wedding.himnher.dev',
      });
    }

    // Create IAM role for Lambda functions to send emails
    this.sesRole = new iam.Role(this, 'SESRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `wedding-rsvp-ses-role-${props.environment}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        SESSendEmailPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
                'ses:SendTemplatedEmail',
                'ses:SendBulkTemplatedEmail',
              ],
              resources: [
                `arn:aws:ses:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:identity/${props.domainName}`,
                `arn:aws:ses:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:configuration-set/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ses:GetSendQuota',
                'ses:GetSendStatistics',
                'ses:DescribeConfigurationSet',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Output configuration set name for use in Lambda functions
    new cdk.CfnOutput(this, 'ConfigurationSetName', {
      value: configurationSet.configurationSetName,
      description: 'SES Configuration Set Name',
    });

    // Output domain identity information
    new cdk.CfnOutput(this, 'VerifiedDomain', {
      value: props.domainName,
      description: 'SES Verified Domain',
    });

    // Output DKIM tokens for domain verification
    const dkimRecords = this.domainIdentity.dkimRecords;
    if (dkimRecords) {
      dkimRecords.forEach((record, index) => {
        new cdk.CfnOutput(this, `DKIMRecord${index + 1}`, {
          value: `${record.name} = ${record.value}`,
          description: `DKIM CNAME Record ${index + 1}`,
        });
      });
    }

    // Output important SES information
    new cdk.CfnOutput(this, 'SESRegion', {
      value: cdk.Stack.of(this).region,
      description: 'SES Region',
    });

    new cdk.CfnOutput(this, 'MailFromDomain', {
      value: `mail.${props.domainName}`,
      description: 'SES Mail FROM Domain',
    });

    new cdk.CfnOutput(this, 'SESVerificationInstructions', {
      value: `To complete verification: 1) Add DKIM records to DNS, 2) Check SES console for verification status, 3) Request production access if needed`,
      description: 'Next Steps',
    });
  }

  /**
   * Grant permissions to send emails to a Lambda function
   */
  public grantSendEmail(lambdaFunction: cdk.aws_lambda.IFunction): void {
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:SendTemplatedEmail',
          'ses:SendBulkTemplatedEmail',
        ],
        resources: ['*'],
      })
    );
  }

  /**
   * Grant permissions to process email queue messages
   */
  public grantEmailQueueAccess(lambdaFunction: cdk.aws_lambda.IFunction): void {
    this.emailQueue.grantConsumeMessages(lambdaFunction);
    this.emailDLQ.grantSendMessages(lambdaFunction);
  }

  /**
   * Grant permissions to process bounce queue messages
   */
  public grantBounceQueueAccess(lambdaFunction: cdk.aws_lambda.IFunction): void {
    this.bounceQueue.grantConsumeMessages(lambdaFunction);
    this.bounceDLQ.grantSendMessages(lambdaFunction);
  }

  /**
   * Grant permissions to process complaint queue messages
   */
  public grantComplaintQueueAccess(lambdaFunction: cdk.aws_lambda.IFunction): void {
    this.complaintQueue.grantConsumeMessages(lambdaFunction);
    this.complaintDLQ.grantSendMessages(lambdaFunction);
  }
}
