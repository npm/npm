
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")
  , npm = require("../npm")

unpublish.usage = "npm unpublish <project>[@<version>]"

function unpublish (args, cb) {
  var thing = args.shift().split("@")
    , project = thing.shift()
    , version = thing.join("@")
  if (!project) return cb("Usage:\n"+unpublish.usage)
  // remove from the cache first
  npm.commands.cache(["clean", project, version], function (er) {
    registry.unpublish(project, version, cb)
  })
}
