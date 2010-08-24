
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")

function unpublish (args, cb) {
  var thing = args.shift().split("@")
    , project = thing.shift()
    , version = thing.join("@")
  if (!project) return cb(new Error(
    "Usage: npm unpublish <project>@<version>"))
  registry.unpublish(project, version, cb)
}
