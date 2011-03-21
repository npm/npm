// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = tag
tag.usage = "npm tag <project>@<version> [<tag>]"

tag.completion = require("./unpublish").completion

var npm = require("../npm")

function tag (args, cb) {
  var thing = (args.shift() || "").split("@")
    , project = thing.shift()
    , version = thing.join("@")
    , t = args.shift() || npm.config.get("tag")
  if (!project || !version || !t) return cb("Usage:\n"+tag.usage)
  require("./utils/npm-registry-client").tag(project, version, t, cb)
}
