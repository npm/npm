
module.exports = cp

var fs = require("fs")
  , Buffer = require("buffer").Buffer

function cp (from, to, cb) {
  if (from === to) return cb()
  fs.open(from, "r", 0666, function (er, fdFrom) {
    if (er) return cb(er)
    fs.open(to, "w+", 0755, function (er, fdTo) {
      if (er) {
        fs.close(fdFrom)
        return cb(er)
      }
      return cp_(fdFrom, fdTo, cb)
    })
  })
}
function cp_ (from, to, cb) {
  fs.read(from, function (er, chunk) {
    if (er) {
      fs.close(from)
      fs.close(to)
      return cb(er)
    }
    if (!chunk || !chunk.length) {
      return chain([fs, "close",from], [fs,"close",to], cb)
    }
    if (chunk instanceof Buffer) {
      fs.write(fd, chunk, 0, chunk.length, null
              , function (er) {
                  if (er) return cb(er)
                  cp_(from, to, cb)
                })
    } else {
      fs.write(fd, chunk, "ascii", null
              , function (er) {
                  if (er) return cb(er)
                  cp_(from, to, cb)
                })
    }
  })
}



