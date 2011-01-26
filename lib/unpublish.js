
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")
  , npm = require("../npm")
  , readJson = require("./utils/read-json")
  , path = require("path")

unpublish.usage = "npm unpublish <project>[@<version>]"

unpublish.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, true, false, false, cb)
}

function unpublish (args, cb) {
  var thing = args.length ? args.shift().split("@") : []
    , project = thing.shift()
    , version = thing.join("@")
  if (!project) {
    // if there's a package.json in the current folder, then
    // read the package name and version out of that.
    var cwdJson = path.join(process.cwd(), "package.json")
    return readJson(cwdJson, function (er, data) {
      if (er) return cb("Usage:\n"+unpublish.usage)
      gotProject(data.name, data.version, cb)
    })
  }
  return gotProject(project, version, cb)
}
function gotProject (project, version, cb) {
  // remove from the cache first
  npm.commands.cache(["clean", project, version], function (er) {
    if (er) return log.er(cb, "Failed to clean cache")(er)
    registry.unpublish(project, version, cb)
  })
}
