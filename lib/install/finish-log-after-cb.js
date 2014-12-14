"use strict"

module.exports = function (log, cb) {
  return function () {
    log.finish()
    cb.apply(null,arguments)
  }
}

