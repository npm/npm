var fs = require('fs')

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
        if (bytesRead !== 2) return elseCb(new Error('Was unable to read the first 2 bytes of ' + file + '; only could read ' + bytesRead))
        if (buffer.toString() === '#!') {
          return ifCb()
        } else {
          return elseCb()
        }
      })
    })
  })
}
