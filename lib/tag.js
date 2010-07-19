
// npm tag <project> <version> <tag>

// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = function (args, cb) {
  var thing = args.shift().split("@")
    , project = thing.shift()
    , version = thing.join("@")
    , tag = args.shift()
  if (!project || !version || !tag) return cb(new Error(
    "Usage: npm tag <project>@<version> <tag>"))
  require("./utils/registry").tag(project, version, tag, cb)
}
