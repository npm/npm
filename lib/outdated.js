/*

npm outdated [pkg]

Does the following:

1. check for a new version of pkg

If no packages are specified, then run for all installed
packages.

*/

module.exports = outdated

outdated.usage = "npm outdated [<pkg> [<pkg> ...]]"

outdated.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, false, true, cb)
}

var readInstalled = require("./utils/read-installed")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , registry = require("./utils/registry")
  , npm = require("../npm")
  , semver = require("./utils/semver")
  , lifecycle = require("./utils/lifecycle")
  , asyncMap = require("./utils/async-map")
  , output = require("./utils/output")

function outdated (args, silent, cb) {
  if (typeof silent === "function") cb = silent, silent = false
  findUpdates(args, function (er, updates) {
    if (er) return log.er(cb, "failed to find outdated packages")(er)
    if (!updates || Object.keys(updates).length === 0) return log(
      "Everything up-to-date.", "outdated", cb)
    if (!silent) {
      var fullList = []
      updates.forEach(function (u) {
        u.have.forEach(function (v) {
          fullList.push(u.name+"@"+v)
        })
      })
      output.write(npm.config.get("outfd"), fullList.join("\n"), function (e) {
        cb(e, updates)
      })
    } else cb(null, updates)
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
          , available = Object.keys(data.versions).filter(function (v) {
              var s = data.versions[v]._nodeSupported
              if (!s) delete data.versions[v]
              return s
            }).sort(semver.sort)
          , highest = available[ available.length - 1 ]
        if (!data.versions[latest]) latest = highest
        log.verbose(latest, pkg+"@latest")
        log.verbose(minHave, pkg+" min installed")
        log.verbose(semver.gt(latest, minHave), pkg+" latest > minHave")
        // check if we have the latest already
        if (have.indexOf(latest) !== -1
            || !latest
            || !semver.gt(latest, minHave)) return cb()
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
