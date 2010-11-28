
module.exports = restart

var lifecycle = require("./utils/lifecycle")
  , stop = lifecycle.cmd("stop")
  , start = lifecycle.cmd("start")
  , restartCmd = lifecycle.cmd("restart", true)
  , log = require("./utils/log")

restart.usage = "npm restart <name>[@<version>] [<name>[@<version>] ...]"

restart.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, true, cb)
}

function restart (args, cb) {
  restartCmd(args, function (er) {
    if (!er) return cb()
    if (er.message !== "Nothing to do") return cb(er)
    stop(args, function (er) {
      if (er) return log.er(cb, "Failed to stop")(er)
      start(args, cb)
    })
  })
}
