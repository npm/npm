'use strict'
var fs = require('fs')
var inflight = require('inflight')
var accessError = require('./access-error.js')

// The Windows implementation of `fs.access` has a bug where it will
// sometimes return access errors all the time for directories, even
// when access is available. As all we actually test ARE directories, this
// is a bit of a problem.
// FIXME: When this is corrected in Node/iojs, update this check to be
// a bit more specific
var isWindows = process.platform === 'win32'

// fs.access first introduced in node 0.12 / io.js
if (fs.access && !isWindows) {
  module.exports = fsAccessImplementation
} else {
  module.exports = fsStatImplementation
}

// exposed only for testing purposes
module.exports.fsAccessImplementation = fsAccessImplementation
module.exports.fsStatImplementation = fsStatImplementation

function fsAccessImplementation (dir, done) {
  done = inflight('exists:' + dir, done)
  if (!done) return
  fs.access(dir, fs.F_OK, done)
}

function fsStatImplementation (dir, done) {
  done = inflight('exists:' + dir, done)
  if (!done) return
  fs.stat(dir, function (er) { done(accessError(dir, er)) })
}
