
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")
  , npm = require("../npm")

unpublish.usage = "npm unpublish <project>[@<version>]"

unpublish.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, true, false, false, cb)
}

function unpublish (args, cb) {
  var thing = args.shift().split("@")
    , project = thing.shift()
    , version = thing.join("@")
  if (!project) return cb("Usage:\n"+unpublish.usage)
  // remove from the cache first
  npm.commands.cache(["clean", project, version], function (er) {
    if (er) return log.er(cb, "Failed to clean cache")(er)
    registry.unpublish(project, version, cb)
  })
}
