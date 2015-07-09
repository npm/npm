'use strict'
var path = require('path')
var fs = require('fs')
var inflight = require('inflight')
var accessError = require('./access-error.js')
var andIgnoreErrors = require('./and-ignore-errors.js')

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
  module.exports = fsOpenImplementation
}

// exposed only for testing purposes
module.exports.fsAccessImplementation = fsAccessImplementation
module.exports.fsOpenImplementation = fsOpenImplementation

function fsAccessImplementation (dir, done) {
  done = inflight('writable:' + dir, done)
  if (!done) return
  fs.access(dir, fs.W_OK, done)
}

function fsOpenImplementation (dir, done) {
  done = inflight('writable:' + dir, done)
  if (!done) return
  var tmp = path.join(dir, '.npm.check.permissions')
  fs.open(tmp, 'w', function (er, fd) {
    if (er) return done(accessError(dir, er))
    fs.close(fd, function () {
      fs.unlink(tmp, andIgnoreErrors(done))
    })
  })
}
