
module.exports = log
var sys = require("sys")

var doColor
try {
  var stdio = require("stdio")
  doColor = stdio.isStderrATTY()
} catch (ex) {
  doColor = true
}

function colorize (msg, color) {
  if (!msg) return ""
  if (!doColor) return msg
  return "\033["+color+"m"+msg+"\033[0m"
}

function log (msg, pref, cb) {
  if (msg instanceof Error) msg = msg.stack || msg.toString()
  pref = colorize(pref, 35)
  pref = pref && (" "+pref)
  if (typeof msg !== "string") {
    msg = sys.inspect(msg, 0, 4)
    if (msg.length + pref.length > 80) {
      msg = ("\n"+msg).split(/\n/).join("\n    ")
    }
  }
  msg = colorize("npm", 31)+pref+" "+msg
  sys.error(msg)
  cb && cb()
}

log.er = function (cb, msg) {
  if (!msg) throw new Error(
    "Why bother logging it if you're not going to print a message?")
  return function (er) {
    if (er) log(msg, "fail")
    cb.apply(this, arguments)
  }
}
