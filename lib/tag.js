// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = tag
tag.usage = "npm tag <project>@<version> [<tag>]"

tag.completion = require("./unpublish.js").completion

var npm = require("./npm.js")
  , registry = npm.registry
  , mapToRegistry = require("./utils/map-to-registry.js")
  , npa = require("npm-package-arg")

function tag (args, cb) {
  var thing = npa(args.shift() || "")
    , project = thing.name
    , version = thing.rawSpec
    , t = args.shift() || npm.config.get("tag")
  if (!project || !version || !t) return cb("Usage:\n"+tag.usage)
  mapToRegistry(project, npm.config, function (er, uri) {
    if (er) return cb(er)

    registry.tag(uri, version, t, cb)
  })
}
