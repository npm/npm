/*

npm outdated [pkg]

Does the following:

1. check for a new version of pkg

If no packages are specified, then run for all installed
packages.

*/

module.exports = outdated

outdated.usage = "npm outdated [<pkg> [<pkg> ...]]"

var readInstalled = require("./utils/read-installed")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , registry = require("./utils/registry")
  , npm = require("../npm")
  , semver = require("./utils/semver")
  , lifecycle = require("./utils/lifecycle")
  , asyncMap = require("./utils/async-map")

function outdated (args, cb) {
  findUpdates(args, function (er, updates) {
    if (er) return log.er(cb, "failed to find outdated packages")(er)
    if (!updates || Object.keys(updates).length === 0) return log(
      "Everything up-to-date.", "outdated", cb)
      var fullList = []
      updates.forEach(function (u) {
        fullList.push(u.name+"@"+u.installed)
      })
      log(fullList.join(" "), "outdated")
      cb(null, updates)
  })
}

function findUpdates (args, cb) {
  readInstalled(args, function (er, inst) {
    if (er) return log.er(cb, "Couldn't read installed packages")(er)
    var tag = npm.config.get("tag")
    asyncMap(Object.keys(inst), function (pkg, cb) {
      log.verbose(pkg, "find updates")
      registry.get(pkg, function (er, data) {
        if (er) return log.verbose(pkg, "not in registry", cb)
        var latest = data["dist-tags"] && data["dist-tags"][tag]
          , have = Object.keys(inst[pkg]).sort(semver.sort)
          , minHave = have[0]
        log.verbose(latest, pkg+"@latest")
        log.verbose(minHave, pkg+" min installed")
        log.verbose(semver.gt(latest, minHave), pkg+" latest > minHave")
        if (!latest || !semver.gt(latest, minHave)) return cb()
        // we have something that's out of date.
        cb(null, { latest : latest
                 , installed : minHave
                 , have : have
                 , pkg : data.versions[latest]
                 , name : data.name
                 })
      })
    }, cb)
  })
}
