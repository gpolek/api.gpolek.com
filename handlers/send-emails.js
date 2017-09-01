'use strict'

const request = require('request-promise')
const utils = require('../lib/utils')
const config = require('../config/config')

function * handler (data, context) {
  context.logger.set('data', data)

  const promises = []
  const subject = "New contact request from gpolek.com"

  const html = `
    <h2>${data.name} <${data.replyTo}> (${data.phone})</h2>
    <br />
    ${data.message}
  `

  const text = `
    ${data.name} <${data.replyTo}> (${data.phone})
    ${data.message}
  `

  const promise = utils.sendSES(data.from, data.to, data.replyTo, subject, html, text)

  promises.push(promise)

  yield promises
}

exports.handler = utils.createQueueHandler(config.emailsQueueUrl, handler)
