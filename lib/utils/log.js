
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
  pref = colorize("npm", 31)
       + (pref ? (" "+colorize(pref, ((pref||"")+"").match(/^!/) ? 33 : 35)) : "")
  if (msg instanceof Error) msg = msg.stack || msg.toString()
  if (typeof msg !== "string") {
    msg = sys.inspect(msg, 0, 4)
  }
  if (msg.indexOf("\n") !== -1) {
    msg = msg.split(/\n/).join("\n"+pref+" ")
  }
  msg = pref+" "+msg
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

log.warn = function (msg, cb) {
  log("", "! WARNING !")
  log(msg, "! WARNING !")
  log("", "! WARNING !")
  cb && cb()
}

log.error = function (msg, cb) {
  log("", "! ERROR !")
  log(msg, "! ERROR !")
  log("", "! ERROR !")
  cb && cb()
}
