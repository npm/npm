
module.exports = prompt

var log = require("./log")
  , buffer = ""
  , stdio = process.binding("stdio")

function prompt (p, def, silent, cb) {
  if (!cb) cb = silent, silent = false
  if (!cb) cb = def, def = undefined
  if (def) p += "("+(silent ? "<hidden>" : def)+") "
  process.stdout.write(p)
  process.stdout.flush()

  return (silent) ? silentRead(def, cb) : read(def, cb)
}

function read (def, cb) {
  var stdin = process.openStdin()
    , val = ""
  stdin.resume()
  stdin.setEncoding("utf8")
  stdin.on("error", cb)
  stdin.on("data", function D (chunk) {
    val += buffer + chunk
    buffer = ""
    if (val.indexOf("\n") !== -1) {
      buffer = val.substr(val.indexOf("\n"))
      val = val.substr(0, val.indexOf("\n"))
      stdin.pause()
      stdin.removeListener("data", D)
      val = val.trim() || def
      cb(null, val)
    }
  })
}

function silentRead (def, cb) {
  var stdin = process.openStdin()
    , val = ""
  stdio.setRawMode(true)
  stdin.resume()
  stdin.on("data", function D (c) {
    c = "" + c
    switch (c) {
      case "\n": case "\r": case "\r\n": case "\u0004":
        stdio.setRawMode(false)
        stdin.removeListener("data", D)
        val = val.trim() || def
        process.stdout.write("\n")
        process.stdout.flush()
        stdin.pause()
        return cb(null, val)
      case "\u0003": case "\0":
        process.exit()
        break
      default:
        val += buffer + c
        buffer = ""
        break
    }
  })
}
