'use strict'
var log = require('npmlog')
var errorMessage = require('./error-message.js')

module.exports = logErrorMessage

function logErrorMessage (er, summaryLevel, detailLevel) {
  var msg = errorMessage(er)
  msg.summary.forEach(function (logline) {
    log[summaryLevel].apply(log, logline)
  })
  msg.detail.forEach(function (logline) {
    log[detailLevel].apply(log, logline)
  })
  return msg
}
