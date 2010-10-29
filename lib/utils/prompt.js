
module.exports = prompt

var log = require("./log")
  , buffer = ""
  , output = require("./output")
  , stdio = process.binding("stdio")
  , npm = require("../../npm")

function prompt (p, def, silent, cb) {
  var outfd = npm.config.get("outfd")
  if (!cb) cb = silent, silent = false
  if (!cb) cb = def, def = undefined
  if (def) p += "("+(silent ? "<hidden>" : def)+") "
  output.write(outfd, p, function () {
    if (silent) silentRead(def, cb)
    else read(def, cb)
  })
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
    val = val.replace(/\r/g, '')
    if (val.indexOf("\n") !== -1) {
      if (val !== "\n") val = val.replace(/^\n+/, "")
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
        stdin.pause()
        output.write(npm.config.get("outfd"), "\n", function () {
          cb(null, val)
        })
      case "\u0003": case "\0":
        return cb("cancelled")
        break
      default:
        val += buffer + c
        buffer = ""
        break
    }
  })
}
