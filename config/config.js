'use strict'

const ms = require('ms')

exports.email = process.env.email

exports.region = process.env.region
exports.stage = process.env.stage

exports.logsLevel = process.env.logsLevel || 'info'
exports.logsFormat = !!process.env.logsFormat || 'json'

exports.emailsTopicArn = process.env.emailsTopicArn
exports.emailsQueueUrl = process.env.emailsQueueUrl

exports.apiKeysCacheExpirationTime = ms('5m')
