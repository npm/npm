'use strict'

const fetch = require('npm-registry-fetch')
const log = require('npmlog')
const npm = require('./npm.js')
const output = require('./utils/output.js')

module.exports = ping

ping.usage = 'npm ping\nping registry'

function ping (args, silent, cb) {
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }

  const registry = npm.config.get('registry')
  log.notice('PING', registry)
  const start = Date.now()
  return fetch('/-/ping?write=true', npm.figgyConfig).then(
    res => res.json().catch(() => ({}))
  ).then(details => {
    if (silent) {
    } else {
      const time = Date.now() - start
      log.notice('PONG', `${time / 1000}ms`)
      if (npm.config.get('json')) {
        output(JSON.stringify({
          registry,
          time,
          details
        }, null, 2))
      } else if (Object.keys(details).length) {
        log.notice('PONG', `${JSON.stringify(details, null, 2)}`)
      }
    }
  }).nodeify(cb)
}
