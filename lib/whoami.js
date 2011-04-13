module.exports = whoami

var npm = require("../npm")
  , output = require("./utils/output")
  , log = require("./utils/log")

whoami.usage = "npm whoami\n(just prints the 'username' config)"

function whoami (args, cb) {
  var me = npm.config.get("username")
  if (!me) me = "Not authed.  Run 'npm adduser'"
  output.write(me, cb)
}
