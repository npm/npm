
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")

unpublish.usage = "npm unpublish <project>[@<version>]"

function unpublish (args, cb) {
  var thing = args.shift().split("@")
    , project = thing.shift()
    , version = thing.join("@")
  if (!project) return cb("Usage:\n"+unpublish.usage)
  registry.unpublish(project, version, cb)
}
