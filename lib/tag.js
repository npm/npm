

// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = tag
tag.usage = "npm tag <project>@<version> <tag>"

tag.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, false, cb)
}

function tag (args, cb) {
  var thing = (args.shift() || "").split("@")
    , project = thing.shift()
    , version = thing.join("@")
    , t = args.shift()
  if (!project || !version || !t) return cb("Usage:\n"+tag.usage)
  require("./utils/registry").tag(project, version, t, cb)
}
