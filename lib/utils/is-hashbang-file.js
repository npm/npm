var fs = require('graceful-fs')

var log = require('npmlog')

module.exports = isHashbangFile

function isHashbangFile (file, ifCb, elseCb) {
  fs.open(file, 'r', function (er, fileHandle) {
    if (er) return elseCb(er)
    // XXX make this resilient against byte-order-marks and other file encoding issues?
    fs.read(fileHandle, new Buffer(new Array(2)), 0, 2, 0, function (er, bytesRead, buffer) {
      fs.close(fileHandle, function (closingError) {
        if (closingError) {
          log.warn('isHashbangFile', 'problem closing file', closingError)
        }
        if (er) return elseCb(er)
        if (buffer.toString() === '#!') {
          return ifCb()
        } else {
          return elseCb()
        }
      })
    })
  })
}
