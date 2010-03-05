
module.exports = log;
var sys = require("sys");

function log (msg, pref, cb) {
  pref = (pref && ": \033[35m" + pref+"\033[0m") || "";
  if (msg) msg = "\033[31mnpm\033[0m"+pref+": "+msg;
  sys.error(msg);
  cb && cb();
}

