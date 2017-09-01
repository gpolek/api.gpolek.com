'use strict'

const http = require('http')
const uuid = require('uuid')
const express = require('express')
const bodyParser = require('body-parser')
const onFinished = require('on-finished')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const utils = require('../utils')
const logger = require('../logger')

const emails = require('./modules/emails')

exports.createApp = function (config) {
  const app = express()

  app.use(bodyParser.json())
  app.use(awsServerlessExpressMiddleware.eventContext())

  // Prepare separate logger for each incoming request

  app.use((req, res, next) => {
    req.logger = logger.createLogger({
      level: config.logsLevel,
      format: config.logsFormat,
      meta: {
        trackId: uuid(),
        lambdaFunctionName: req.apiGateway.context.functionName,
        lambdaFunctionVersion: req.apiGateway.context.functionVersion,
        lambdaContainerId: utils.getContainerId(),
        requestMethod: req.method,
        requestUrl: req.originalUrl
      }
    })

    next()
  })

  // Access logs

  app.use((req, res, next) => {
    req.logger.debug('Incoming request')

    const startTime = Date.now()

    onFinished(res, () => {
      let level = 'info'

      if (res.statusCode >= 400) level = 'warn'
      if (res.statusCode >= 500) level = 'error'

      req.logger.log(level, 'Response', {
        responseTime: Date.now() - startTime,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent']
      })
    })

    next()
  })

  // We use wildcard * before path to support both direct calls to API Gateway
  // and calls proxied by Cloudfront Distribution. In case of CloudFront
  // requests come with /api/products when called directly it is /products
  // CloudFront is used to call api via *.g2a.com domain.

  app.post('*/emails', emails.sendEmail)

  app.use((err, req, res, next) => {
    console.error(err)

    const status = err.status || 500
    const msg = err.expose ? err.message : http.STATUS_CODES[status]

    res.status(status)
    res.json({ error: msg })
  })

  // Handle errors

  app.use((err, req, res, next) => {
    req.logger.error(err)

    const status = err.status || 500
    const msg = err.expose ? err.message : http.STATUS_CODES[status]

    res.status(status)
    res.json({ error: msg })
  })

  return app
}
