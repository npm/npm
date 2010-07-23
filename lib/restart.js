
module.exports = restart

var lifecycle = require("./utils/lifecycle")
  , stop = lifecycle.cmd("stop")
  , start = lifecycle.cmd("start")
  , log = require("./utils/log")

function restart (args, cb) {
  stop(args, function (er) {
    if (er) return log.er(cb, "Failed to stop")(er)
    start(args, cb)
  })
}
