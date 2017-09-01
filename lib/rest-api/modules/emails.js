'use strict'

const Ajv = require('ajv')
const utils = require('../../utils')
const config = require('../../../config/config')
const schema = require('../../../config/schema')

var ajv = new Ajv();

exports.sendEmail = function (req, res, next) {

  res.set({
    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
  })

  if(ajv.validate(schema.email, req.body)) {
    const messageContent = {
      from: config.email,
      to: [config.email],
      replyTo: [req.body.email],
      name: req.body.name,
      phone: req.body.phone,
      message: req.body.message
    }
    utils.publishSNS(config.emailsTopicArn, messageContent)
      .then(data => {
        res.json(data)
      })
      .catch(err => next(err))
  } else {
    res.status(400)
    res.json({ error: `Not a valid request body` })
  }
}
