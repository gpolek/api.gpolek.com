# api.gpolek.com

Serverless API using AWS Lambda hosted under api.gpolek.com for gpolek.com and grzegorzpolek.com purposes

### Development

Install dependencies:

    $ npm install

Run tests:

    $ npm test

### Deployment

Configure stages e.g. `./stages/prod.yml`

```yaml
---
runtime: nodejs4.3
region: AWS_REGION
accountId: AWS_ACCOUNT_ID
deploymentBucket: AWS_BUCKET_NAME
email: hello@yourdomain.com
memorySize: 128
vpc: false
```

Deploy:

    $ npm run deploy
