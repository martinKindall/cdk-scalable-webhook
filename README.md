# CDK Patterns - The Scalable Webhook

The original project https://github.com/cdk-patterns/serverless.
This is just a rewrite of this pattern using CDK 2.X.

## Deploy

```bash
npm run build
cdk deploy
```

## Usage

Send a POST request to the __\/send__ endpoint of the created API Gateway, with a body like this:

```json
{
    "message": {
        "data": "Hello from CDK patterns"
    }
}
```

Verify in Cloudwatch logs that the lambda properly processes the message and check that the entry is written in DynamoDB.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
