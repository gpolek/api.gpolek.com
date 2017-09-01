'use strict'

const aws = require('aws-sdk')
const utils = require('../lib/utils')

const apiKeysCacheExpirationTime = require('../config/config').apiKeysCacheExpirationTime
const apiGateway = new aws.APIGateway()

function * getApiKeys () {
  const cacheAge = Date.now() - (getApiKeys.retrievedAt || 0)
  const params = {
    includeValues: true
  }

  if (cacheAge > apiKeysCacheExpirationTime) {
    getApiKeys.apiKeys = apiGateway.getApiKeys(params).promise().then(keys => keys.items)
    getApiKeys.retrievedAt = Date.now()
  }

  return yield getApiKeys.apiKeys
}

function generatePolicy (principalId, effect, resource) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  }
}

function * handler (event, context) {
  const token = event.authorizationToken
  const apiKeys = yield getApiKeys()

  const authorizerKey = apiKeys.find(key => key.value === token)

  if (authorizerKey && authorizerKey.enabled) {
    return generatePolicy(authorizerKey.name, 'Allow', event.methodArn)
  }

  // throw new Error('Unauthorized') is here because we dont want to use context.fail method, we have createHandler for that
  // createHandler will handle this error and return right status, for this case '401 Unauthorized'
  throw new Error('Unauthorized')
}

exports.handler = utils.createHandler(handler)
