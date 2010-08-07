
module.exports = prompt

var stdin
  , log = require("./log")
  , buffer = ""

function prompt (p, def, silent, cb) {
  if (!stdin) stdin = process.openStdin()
  if (!cb) cb = silent, silent = false
  if (!cb) cb = def, def = undefined
  if (silent) log("No way to do silent input in node.  Sorry.", "!")
  if (def) p += "("+(silent ? "<hidden>" : def)+") "
  var i = process.openStdin()
    , val = ""
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
  process.stdout.write(p)
  process.stdout.flush()
}
