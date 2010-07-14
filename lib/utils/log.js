
module.exports = log
var sys = require("sys")

function log (msg, pref, cb) {
  if (msg instanceof Error) msg = msg.stack || msg.toString()
  if (typeof msg !== "string") msg = sys.inspect(msg, 0, 4)
  pref = (pref && " \033[35m" + pref+"\033[0m") || ""
  if (msg) msg = "\033[31mnpm\033[0m"+pref+" "+msg
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
