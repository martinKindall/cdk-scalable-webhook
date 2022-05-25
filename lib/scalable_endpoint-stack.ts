import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ScalableEndpointStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'ScalableEndpointQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [queue.queueArn],
      actions: ['sqs:SendMessage']
    });

    const policy = new iam.Policy(this, 'MyPolicy');
    policy.addStatements(statement);

    const role = new iam.Role(this, 'someRole', {assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')});
    role.attachInlinePolicy(policy);

    const httpApi = new apigatewayv2.CfnApi(this, 'MyHttpApi', {
      name: 'MyHttpApi',
      protocolType: 'HTTP'
    });

    const sqsIntegration = new apigatewayv2.CfnIntegration(this, "SqsIntegration", {
      apiId: httpApi.ref,
      integrationSubtype: 'SQS-SendMessage',
      integrationType: 'AWS_PROXY',
      payloadFormatVersion: '1.0',
      credentialsArn: role.roleArn,
      requestParameters: {
        QueueUrl: queue.queueUrl,
        MessageBody: "$request.body.message"
      }
    });

    new apigatewayv2.CfnRoute(this, "Route", {
      apiId: httpApi.ref,
      routeKey: 'POST /send',
      target: 'integrations/' + sqsIntegration.ref
    });

    const stage = new apigatewayv2.CfnStage(this, 'DevStage', {
      stageName: 'dev',
      apiId: httpApi.ref
    });

    const deployment = new apigatewayv2.CfnDeployment(this, 'ApiDeployment', {
      stageName: stage.stageName,
      apiId: httpApi.ref
    });

    const table = new dynamodb.Table(this, 'MyTable', {
      readCapacity: 1,
      writeCapacity: 1,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      }
    });

    const sqsSubscribeLambda = new lambda.Function(this, 'SubscribeLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'subscriber.handler',
      reservedConcurrentExecutions: 2,
      environment: {
        queueURL: queue.queueUrl,
        tableName: table.tableName
      }
    });

    queue.grantConsumeMessages(sqsSubscribeLambda);
    sqsSubscribeLambda.addEventSource(new SqsEventSource(queue, {}));
    table.grantReadWriteData(sqsSubscribeLambda);
  }
}
