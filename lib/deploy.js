module.exports = deploy

var deployCmd = require("./utils/lifecycle.js").cmd("deploy")
  , log = require("npmlog")

function deploy (args, cb) {
  deployCmd(args, function (er) {
    if (!er) return cb()
    if (er.code === "ELIFECYCLE") {
      return cb("Deploy failed.  See above for more details.")
    }
    return cb(er)
  })
}
