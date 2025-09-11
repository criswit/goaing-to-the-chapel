import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';

export interface EmailStreamProcessorProps {
  /**
   * The DynamoDB table with streams enabled
   */
  table: dynamodb.ITable;

  /**
   * The SQS queue to send email messages to
   */
  emailQueue: sqs.Queue;

  /**
   * Environment name for resource naming
   */
  environment: string;

  /**
   * The domain name for email sending
   */
  domainName: string;

  /**
   * The website URL for email templates
   */
  websiteUrl: string;

  /**
   * SNS topic for alarm notifications (optional)
   */
  alarmTopic?: sns.Topic;
}

export class EmailStreamProcessor extends Construct {
  /**
   * Lambda function that processes DynamoDB stream records
   */
  public readonly streamProcessor: NodejsFunction;

  /**
   * EventBridge Pipe connecting DynamoDB Streams to SQS
   */
  public readonly pipe: pipes.CfnPipe;

  constructor(scope: Construct, id: string, props: EmailStreamProcessorProps) {
    super(scope, id);

    // Create Lambda function to process stream records and transform them for email queue
    this.streamProcessor = new NodejsFunction(this, 'StreamProcessorFunction', {
      functionName: `wedding-stream-processor-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/process-stream-for-email.ts'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        TABLE_NAME: props.table.tableName,
        SOURCE_EMAIL: `espoused@${props.domainName}`,
        WEBSITE_URL: props.websiteUrl,
        ENVIRONMENT: props.environment,
        LOG_LEVEL: 'DEBUG', // Enable detailed logging
      },
      logGroup: new logs.LogGroup(this, 'StreamProcessorLogs', {
        logGroupName: `/aws/lambda/wedding-stream-processor-${props.environment}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // Grant permissions to read table
    props.table.grantStreamRead(this.streamProcessor);

    // Create log group for EventBridge Pipe
    const pipeLogGroup = new logs.LogGroup(this, 'PipeLogGroup', {
      logGroupName: `/aws/vendedlogs/pipes/wedding-email-pipe-${props.environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for EventBridge Pipe
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
      roleName: `wedding-email-pipe-role-${props.environment}`,
      inlinePolicies: {
        PipePolicy: new iam.PolicyDocument({
          statements: [
            // Permission to read from DynamoDB Streams
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              resources: [props.table.tableStreamArn!],
            }),
            // Permission to invoke Lambda function
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [this.streamProcessor.functionArn],
            }),
            // Permission to write to SQS queue
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
              resources: [props.emailQueue.queueArn],
            }),
            // Permission for CloudWatch Logs
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [
                `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create EventBridge Pipe with enhanced configuration
    this.pipe = new pipes.CfnPipe(this, 'EmailPipe', {
      name: `wedding-email-pipe-${props.environment}`,
      description: 'Processes DynamoDB stream events for RSVP email notifications',
      roleArn: pipeRole.roleArn,
      source: props.table.tableStreamArn!,
      target: props.emailQueue.queueArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 10,
          maximumBatchingWindowInSeconds: 5,
          onPartialBatchItemFailure: 'AUTOMATIC_BISECT',
          parallelizationFactor: 1, // Process shards sequentially for order
          maximumRecordAgeInSeconds: 3600, // 1 hour
          maximumRetryAttempts: 3,
        },
        // Simplify filter - just check for INSERT or MODIFY events
        // The enrichment function will handle filtering for RSVP records
        filterCriteria: {
          filters: [
            {
              pattern: JSON.stringify({
                eventName: ['INSERT', 'MODIFY'],
              }),
            },
          ],
        },
      },
      enrichment: this.streamProcessor.functionArn,
      enrichmentParameters: {
        // Pass the raw records array to the enrichment function
        // EventBridge Pipes automatically batches records from DynamoDB Streams
        // The enrichment function receives an array of stream records
      },
      // Target parameters can be added here if needed for batch configuration
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: pipeLogGroup.logGroupArn,
        },
        level: 'INFO',
        includeExecutionData: ['ALL'],
      },
    });

    // Create CloudWatch metrics and alarms
    const pipeErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Pipes',
      metricName: 'SourceErrors',
      dimensionsMap: {
        PipeName: this.pipe.name!,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const enrichmentErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Pipes',
      metricName: 'EnrichmentErrors',
      dimensionsMap: {
        PipeName: this.pipe.name!,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const targetErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Pipes',
      metricName: 'TargetErrors',
      dimensionsMap: {
        PipeName: this.pipe.name!,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    // Create alarms
    const pipeErrorAlarm = new cloudwatch.Alarm(this, 'PipeErrorAlarm', {
      alarmName: `wedding-email-pipe-errors-${props.environment}`,
      metric: pipeErrorMetric,
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alert when EventBridge Pipe encounters errors reading from DynamoDB Streams',
    });

    const enrichmentErrorAlarm = new cloudwatch.Alarm(this, 'EnrichmentErrorAlarm', {
      alarmName: `wedding-email-enrichment-errors-${props.environment}`,
      metric: enrichmentErrorMetric,
      threshold: 3,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when enrichment Lambda function fails',
    });

    const targetErrorAlarm = new cloudwatch.Alarm(this, 'TargetErrorAlarm', {
      alarmName: `wedding-email-target-errors-${props.environment}`,
      metric: targetErrorMetric,
      threshold: 3,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when EventBridge Pipe fails to deliver messages to SQS',
    });

    // Lambda function metrics
    const lambdaErrorMetric = this.streamProcessor.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const lambdaThrottleMetric = this.streamProcessor.metricThrottles({
      period: cdk.Duration.minutes(5),
    });

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `wedding-stream-processor-errors-${props.environment}`,
      metric: lambdaErrorMetric,
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when stream processor Lambda encounters errors',
    });

    // Add SNS topic for alarm notifications if provided
    if (props.alarmTopic) {
      pipeErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(props.alarmTopic));
      enrichmentErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(props.alarmTopic));
      targetErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(props.alarmTopic));
      lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(props.alarmTopic));
    }

    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'StreamProcessorDashboard', {
      dashboardName: `wedding-email-stream-${props.environment}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EventBridge Pipe Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Pipes',
            metricName: 'InvocationAttempts',
            dimensionsMap: { PipeName: this.pipe.name! },
            statistic: cloudwatch.Stats.SUM,
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Pipes',
            metricName: 'SuccessfulRequestCount',
            dimensionsMap: { PipeName: this.pipe.name! },
            statistic: cloudwatch.Stats.SUM,
          }),
        ],
        right: [pipeErrorMetric, enrichmentErrorMetric, targetErrorMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Enrichment Function',
        left: [this.streamProcessor.metricInvocations(), this.streamProcessor.metricDuration()],
        right: [lambdaErrorMetric, lambdaThrottleMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Email Queue',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesSent',
            dimensionsMap: { QueueName: props.emailQueue.queueName },
            statistic: cloudwatch.Stats.SUM,
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesReceived',
            dimensionsMap: { QueueName: props.emailQueue.queueName },
            statistic: cloudwatch.Stats.SUM,
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: props.emailQueue.queueName },
            statistic: cloudwatch.Stats.AVERAGE,
          }),
        ],
        width: 12,
      })
    );

    // Output pipe and monitoring information
    new cdk.CfnOutput(this, 'PipeArn', {
      value: this.pipe.attrArn,
      description: 'EventBridge Pipe ARN',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'StreamProcessorLogGroup', {
      value: `/aws/lambda/wedding-stream-processor-${props.environment}`,
      description: 'Stream Processor Lambda Log Group',
    });

    new cdk.CfnOutput(this, 'PipeLogGroupName', {
      value: `/aws/vendedlogs/pipes/wedding-email-pipe-${props.environment}`,
      description: 'EventBridge Pipe Log Group',
    });
  }
}
