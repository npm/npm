var os = require('os')
var path = require('path')
var Transform = require('stream').Transform

var fs = require('graceful-fs')
var fsWriteStreamAtomic = require('fs-write-stream-atomic')

module.exports.dos2Unix = dos2Unix

function dos2Unix (file, cb) {
  fs.stat(file, function (er, stats) {
    if (er) return cb(er)
    var previousChunkEndedInCR = false
    fs.createReadStream(file)
      .on('error', cb)
      .pipe(new Transform({
        transform: function (chunk, encoding, done) {
          var data = chunk.toString()
          if (previousChunkEndedInCR) { data = '\r' + data }
          previousChunkEndedInCR = (data[data.length - 1] === '\r')
          done(null, data.replace(/\r\n/g, '\n'))
        }
      }))
      .on('error', cb)
      .pipe(fsWriteStreamAtomic(file, { mode: stats.mode }))
      .on('error', cb)
      .on('finish', cb)
  })
}

// could add unix2Dos and legacy Mac functions if need be
