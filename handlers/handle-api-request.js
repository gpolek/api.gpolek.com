'use strict'

const awsServerlessExpress = require('aws-serverless-express')
const restApi = require('../lib/rest-api')
const config = require('../config/config')

const app = restApi.createApp(config)
const server = awsServerlessExpress.createServer(app)

exports.handler = awsServerlessExpress.proxy.bind(null, server)
