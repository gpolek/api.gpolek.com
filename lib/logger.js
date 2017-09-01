'use strict'

const winston = require('winston')

function formatJson (options, extraMeta) {
  const basicFields = {
    '@timestamp': new Date().toISOString(),
    '@version': 1,
    level: options.level.toUpperCase(),
    message: options.message || ''
  }

  return JSON.stringify(Object.assign({}, extraMeta, options.meta, basicFields))
}

exports.createLogger = function createLogger (params) {
  const level = params.level || 'info'
  const meta = Object.assign({}, params.meta)
  const json = (params.format !== 'text')

  const transportParams = {
    level: level,
    colorize: json,
    timestamp: true,
    stderrLevels: [ 'emerg', 'error', 'warn' ],
    formatter: json ? opts => formatJson(opts, meta) : null
  }

  const loggerParams = {
    transports: [ new winston.transports.Console(transportParams) ],
    levels: {
      emerg: 0,
      error: 1,
      warn: 2,
      info: 3,
      verbose: 4,
      debug: 5
    },
    colors: {
      emerg: 'red bold inverse',
      error: 'red bold',
      warn: 'yellow bold',
      info: 'white bold',
      verbose: 'gray bold',
      debug: 'rainbow bold'
    }
  }

  const logger = new winston.Logger(loggerParams)

  logger.set = (key, value) => { meta[key] = value; return logger }
  logger.clone = () => createLogger(params)

  return logger
}
