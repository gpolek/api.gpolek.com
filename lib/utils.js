'use strict'

const co = require('co')
const aws = require('aws-sdk')
const uuid = require('uuid/v4')
const config = require('../config/config')
const createLogger = require('./logger').createLogger

function getContainerId () {
  if (!getContainerId._id) {
    getContainerId._id = uuid()
  }

  return getContainerId._id
}

function createHandler (handler) {
  return function (event, lambdaContext, callback) {
    const startTime = Date.now()

    const logger = createLogger({
      level: config.logsLevel,
      format: config.logsFormat,
      meta: {
        trackId: uuid(),
        lambdaFunctionName: lambdaContext.functionName,
        lambdaFunctionVersion: lambdaContext.functionVersion,
        lambdaContainerId: getContainerId()
      }
    })

    const handlerContext = {
      logger
    }

    if (event && event.data && event.data[config.keepHot.field]) {
      logger.verbose('Keep hot execution')
      return callback(null, null)
    }

    logger.info('Started lambda execution', { event })

    co(handler, event, handlerContext)
      .then(data => {
        callback(null, data)
        logger.info('Finished lambda execution', { time: Date.now() - startTime })
      })
      .catch(error => callback(error))
  }
}

function createQueueHandler (queueName, handler) {
  const sqs = new aws.SQS()

  return createHandler(function * (event, context) {
    if (event.debug) {
      return yield handler(event.data)
    }

    while (true) {
      const result = yield sqs.receiveMessage({
        QueueUrl: queueName,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 60
      }).promise()

      // Break if there is no more messages
      if (result.Messages == null || result.Messages.length === 0) {
        context.logger.info('Received 0 messages from queue - quiting')
        break
      }

      context.logger.info(`Received ${result.Messages.length} messages from queue`)

      try {
        yield result.Messages.map(function * (msg) {
          let data = JSON.parse(msg.Body)

          // Message published through SNS have different structure, there
          // are few extra SNS-specific fields and actual message is stored
          // in `Message` field.
          if (data.Type === 'Notification') {
            data = JSON.parse(data.Message)
          }

          const handlerContext = Object.assign({}, context, { logger: context.logger.clone() })

          try {
            yield handler(data, handlerContext)
          } catch (error) {
            handlerContext.logger.error(error)
            throw error
          }

          yield sqs.deleteMessage({
            QueueUrl: queueName,
            ReceiptHandle: msg.ReceiptHandle
          }).promise()
        })
      } catch (error) {
        context.logger.error(error)
      }
    }
  })
}

function encodeId (storeId, productId) {
  return `${encodeURIComponent(storeId)}#${encodeURIComponent(productId)}`
}

function randomString (len) {
  let str = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  len = len || 10

  while (len) {
    str += possible.charAt(Math.floor(Math.random() * possible.length))
    len--
  }

  return str
}

function publishSNS (destination, content) {
  const sns = new aws.SNS()

  return sns.publish({
    TopicArn: destination,
    Message: JSON.stringify(content)
  }).promise()
}

function publishSQS (destination, content) {
  const sqs = new aws.SQS()

  return sqs.sendMessage({
    QueueUrl: destination,
    MessageBody: JSON.stringify(content)
  }).promise()
}

function sendSES (from, to, replyTo, subject, html, text) {
  const ses = new aws.SES({apiVersion: '2010-12-01'});

  return ses.sendEmail( {
     Source: from,
     Destination: { ToAddresses: to },
     ReplyToAddresses: replyTo,
     Message: {
         Subject: {
            Data: subject
         },
         Body: {
            Html: {
                Data: html,
            },
            Text: {
                Data: text,
            }
        }
     }
  }).promise()
}

exports.getContainerId = getContainerId
exports.createHandler = createHandler
exports.createQueueHandler = createQueueHandler
exports.encodeId = encodeId
exports.randomString = randomString
exports.publishSNS = publishSNS
exports.publishSQS = publishSQS
exports.sendSES = sendSES
