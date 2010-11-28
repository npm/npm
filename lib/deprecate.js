
module.exports = deprecate

deprecate.usage = "npm deprecate <pkg>[@<version>] <message>"

deprecate.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, true, false, false, cb)
}

var registry = require("./utils/registry")
  , semver = require("./utils/semver")
  , log = require("./utils/log")
  , asyncMap = require("./utils/async-map")

function deprecate (args, cb) {
  var pkg = args[0]
    , msg = args[1]
  if (msg === undefined) return cb(new Error(deprecate.usage))
  // fetch the data and make sure it exists.
  pkg = pkg.split(/@/)
  var name = pkg.shift()
    , ver = pkg.join("@")
  if (semver.validRange(ver) === null) {
    return cb(new Error("invalid version range: "+ver))
  }
  registry.get(name, function (er, data) {
    if (er) return cb(er)
    // filter all the versions that match
    Object.keys(data.versions).filter(function (v) {
      return semver.satisfies(v, ver)
    }).forEach(function (v) {
      data.versions[v].deprecated = msg
    })
    // now update the doc on the registry
    registry.request.PUT(data._id, data, cb)
  })
}
