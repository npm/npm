module.exports = loadCAFile

var fs = require("fs")

function loadCAFile(cafilePath, cb) {
  if (!cafilePath)
    return process.nextTick(cb)

  fs.readFile(cafilePath, "utf8", afterCARead.bind(this))

  function afterCARead(er, cadata) {

    // Previous cafile no longer exists, so just continue on gracefully
    if (er && er.code === 'ENOENT') {
      return cb()
    }
    if (er) {
      return cb(er)
    }

    var delim = "-----END CERTIFICATE-----"
    var output

    output = cadata
      .split(delim)
      .filter(function(xs) {
        return !!xs.trim()
      })
      .map(function(xs) {
        return xs.trimLeft() + delim
      })

    this.set("ca", output)
    cb(null)
  }
}
