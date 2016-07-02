'use strict'
var fs = require('fs-extra')
var SaveStack = require('./save-stack.js')

module.exports = move

function move (from, to, cb) {
  var saved = new SaveStack(move)
  fs.move(from, to, function (er) {
    if (er) {
      return cb(saved.completeWith(er))
    }
    return cb()
  })
}
