'use strict'

const test = require('tape')
const yaml = require('yamljs')

const config = require('../lib/config')

test('All environment variables passed from serveless to functions should be exposed by config.js', assert => {
  const env = yaml.load(__dirname + '/../serverless.yml').provider.environment

  for (const key of Object.keys(env)) {
    const hasProperty = config.hasOwnProperty(key)
    assert.ok(hasProperty, `config should expose variable ${key}`)
  }

  assert.end()
})
