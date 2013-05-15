module.exports = whoami

var npm = require("./npm.js")
  , log = require("npmlog")

whoami.usage = "npm whoami\n(just prints the 'username' config)"

function whoami (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false
  var me = npm.config.get("username")
  msg = me ? me : "Not authed.  Run 'npm adduser'"
  if (!silent) log.write(msg + "\n")
  process.nextTick(cb.bind(this, null, me))
}
