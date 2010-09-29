

// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = tag
tag.usage = "npm tag <project>@<version> <tag>"

function tag (args, cb) {
  var thing = (args.shift() || "").split("@")
    , project = thing.shift()
    , version = thing.join("@")
    , t = args.shift()
  if (!project || !version || !t) return cb("Usage:\n"+tag.usage)
  require("./utils/registry").tag(project, version, t, cb)
}
