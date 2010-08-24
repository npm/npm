
module.exports = publish

var npm = require("../npm")
  , registry = require("./utils/registry")
  , log = require("./utils/log")

function publish (args, cb) {
  if (args.length === 0) args = ["."]
  log.verbose(args, "publish")
  npm.commands.cache.add(args[0], args[1], function (er, data) {
    if (er) return cb(er)
    log.verbose(data, "publish")
    if (!data) return cb(new Error("no data!?"))
    registry.publish(data, cb)
  })
}
