'use strict'
module.exports = config

let npm

function config (opts, key) {
  if (key == null) {
    key = opts
    opts = null
  }
  if (opts && (key in opts)) {
    return opts[key]
  } else {
    if (!npm) npm = require('../npm.js')
    return npm.config.get(key)
  }
}

