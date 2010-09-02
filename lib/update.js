/*
http://github.com/isaacs/npm/issues/issue/7

npm update [pkg]

Does the following:

1. check for a new version of pkg
2. if not found, then quit
3. install new version of pkg
4. For each other version of pkg, for each dependent in
  other version's dependents folder, if the new version
  would satisfy the dependency as well, update other
  version's dependent's dependency links to point at the
  new version
5. If no dependents are left, then remove old version

If no packages are specified, then run for all installed
packages.

Depending on config value, update-dependents, run steps 4-5
after installation

* always - Run an update after every install, so as to
  minimize the different number of versions of things.
* true - Default, run if newly installed version is
  the highest version number (that is, don't downgrade
  by default)
* false - Don't run "update" automatically after
  installation.

*/

module.exports = update

var readInstalled = require("./utils/read-installed")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , registry = require("./utils/registry")
  , npm = require("../npm")
  , semver = require("./utils/semver")
  , lifecycle = require("./utils/lifecycle")
  , asyncMap = require("./utils/async-map")

function update (args, cb) {
  findUpdates(args, function (er, updates) {
    if (er) return log.er(cb, "failed to find updates")(er)
    if (!updates || Object.keys(updates).length === 0) return log(
      "Nothing to update", "update", cb)
    installUpdates(updates, cb)
  })
}
function installUpdates (updates, cb) {
  npm.config.set("update-dependents", true)
  var installList = []
    , updateList = []
    , preChain = []
    , postChain = []
    , fullList = []
  updates.forEach(function (u) {
    if (u.have.indexOf(u.latest) === -1) {
      installList.push(u.name+"@"+u.latest)
    } else {
      updateList.push(u.name+"@"+u.latest)
    }
    fullList.push(u.name+"@"+u.latest)
    preChain.push([lifecycle, u.pkg, "preupdate"])
    postChain.push( [lifecycle, u.pkg, "update"]
                  , [lifecycle, u.pkg, "postupdate"]
                  )
  })
  cb = (function (cb) { return function (er) {
    log(fullList.join(" "), er ? "failed to update" : "updated")
    cb(er)
  }})(cb)
  log(fullList.join(" "), "updates")
  chain(preChain.concat(function (er) {
    if (er) return cb(er)
    if (installList.length > 0) {
      return npm.commands.install(installList, function (er) {
        if (er) return log.er(cb, "install failed "+installList)(er)
        updateAndActivate(updateList, fullList, postChain, cb)
      })
    }
    updateAndActivate(updateList, fullList, postChain, cb)
  }))
}
function updateAndActivate (updateList, fullList, postChain, cb) {
  npm.commands["update-dependents"](updateList, function (er) {
    if (er) return log.er(cb, "update failed "+updateList)(er)
    npm.commands.activate(fullList, function (er) {
      if (er) return cb(er)
      chain(postChain.concat(cb))
    })
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
                 , have : have
                 , pkg : data.versions[latest]
                 , name : data.name
                 })
      })
    }, cb)
  })
}

