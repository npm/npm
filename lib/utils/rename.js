'use strict'
var fs = require('graceful-fs-extra')
var SaveStack = require('./save-stack.js')

module.exports = rename

function rename (from, to, cb) {
  var saved = new SaveStack(rename)
  fs.move(from, to, function (er) {
    if (er) {
      return cb(saved.completeWith(er))
    } else {
      return cb()
    }
  })
}
