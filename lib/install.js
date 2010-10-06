
// npm install <pkg> <pkg> <pkg>
// npm install <pkg@version> <pkg@"1.0.0 - 1.99.99"> <pkg[@latest]> <pkg@tagname>

// 1. fetch the data for that package/tag into the cache
// 2. if it has any dependents, which are not yet installed,
// then add those to the list, and fetch their data.
// 3. when all the pkgs are fetched to the cache, and we have a set
// of packages that are either installed or fetched which
// will satisfy everyone's dependencies, then untar into the
// target directories for each of them.
// 4. build each of the packages that aren't already installed

module.exports = install

install.usage = "npm install <tarball file>"
              + "\nnpm install <tarball url>"
              + "\nnpm install <folder>"
              + "\nnpm install <pkg>"
              + "\nnpm install <pkg>@<tag>"
              + "\nnpm install <pkg>@<version>"
              + "\nnpm install <pkg>@<version range>"
              + "\n\nCan specify one or more: npm install ./foo.tgz bar@stable /some/folder"
              + "\nInstalls '.' if no argument supplied"

var registry = require("./utils/registry")
  , npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , installedPackages
  , semver = require("./utils/semver")
  , url = require("url")
  , fetch = require("./utils/fetch")
  , rm = require("./utils/rm-rf")
  , mkdir = require("./utils/mkdir-p")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , cache = require("./cache")
  , asyncMap = require("./utils/async-map")

function install (pkglist, cb) {
  if (pkglist.length === 0) pkglist = ["."]
  // it's helpful to know what we have already
  if (!installedPackages) return readInstalled([], function (er, data) {
    if (er) return cb(er)
    installedPackages = data || {}
    install(pkglist, cb)
  })

  log.verbose(pkglist, "install pkglist")
  var mustInstall = pkglist.slice(0)

  // three lists: "pkglist", "next", and "reg"
  // asyncMap over the "left" list: for each "it"
  //   find out what it is
  //   if it's version/range installed or on "reg" list, continue.
  //   if it's a url, fetch to cache and add the name/version to "next"
  //   if it's a tag, fetch the json, add the version to "next"
  //   if it's a version(range) not installed, then fetch the json,
  //     add url to "next"
  //   if it's a specific version in cache, then unpack, add to "reg"
  //     list, add its deps to "next"
  // if the "next" list is not empty, then pkglist=next,next=[], and repeat.
  // if it is, then build all the "reg" folders.

  var reg = Object.create(installedPackages)
    , seen = {}
  log.verbose(mustInstall, "must install")
  asyncMap(pkglist, function (pkg, cb) {
    install_(pkg, reg, seen, mustInstall.indexOf(pkg) !== -1, pkglist, cb)
  }, function (er) {
    if (er) return cb(er)
    buildAll(reg, cb)
  })
}

// call the cb with the "next" thing(s) to look up for this one, or nothing
function install_ (pkg, reg, seen, mustHave, pkglist, cb) {
  log.verbose(pkg, "install_")
  if (seen[pkg]) return cb() // repeat, skip it
  seen[pkg] = true

  // it's a local thing or a url if it has a / in it.
  if (pkg.indexOf("/") !== -1 || pkg === ".") {
    log.silly(pkg, "install local")
    return cache.add(pkg, finisher(pkg, reg, pkglist, cb))
  }

  // now we know it's not a URL or file,
  // so handle it like a tag, version, or range.
  pkg = pkg.split("@")
  var name = pkg[0]
    , defTag = npm.config.get("tag")
    , ver = pkg.slice(1).join("@").trim() || defTag
    , range = semver.validRange(ver)
    , exact = semver.valid(ver)
    , tag = !exact && !range && range !== "" && ver
  log.verbose([pkg, mustHave], "must install?")
  pkg = pkg.join("@")
  seen[name+"@"+ver] = true

  // if there is a satisfying version already, then simply move on.
  if (!tag && findSatisfying(pkg, name, range, mustHave, reg)) {
    return cb()
  }

  // at this point, assume that it has to be installed.
  if (exact) {
    log.verbose("exact", pkg)
    // just pull the data out of the cache to ensure it's there
    return cache.read(name, ver, finisher(pkg, reg, pkglist, cb))
  }

  getData(name, function (er, data) {
    if (er) return cb(er)
    log.silly(data, pkg)
    if (tag) {
      log.verbose(tag, pkg+" tag")
      var tags = data["dist-tags"]
      if (!tags[tag]) return log.er(cb, "Tag not found: "+data.name+"@"+tag)(er)
      install_(data.name+"@"+tags[tag], reg, seen, mustHave, pkglist, cb)
    } else {
      log.verbose(tag, pkg+" range")
      // prefer the default tag version.
      var defTag = npm.config.get("tag")
        , satis
      defTag = defTag && data["dist-tags"] && data["dist-tags"][defTag]
      if (semver.satisfies(defTag, range)) satis = defTag
      else satis = semver.maxSatisfying(Object.keys(data.versions), range)

      if (!satis) return cb(new Error(
        "No satisfying version found for '"+data.name+"'@'"+range+"'"))
      install_(data.name+"@"+satis, reg, seen, mustHave, pkglist, cb)
    }
  })
}
function getData (name, cb) {
  var data = npm.get(name)
  if (data) return cb(null, data)
  registry.get(name, function (er, data) {
    if (data && data.error === "not_found") {
      er = new Error("404 Not Found: "+name)
      er.errno = npm.E404
      er.pkgid = name
    }
    if (er) return cb(er)
    if (!data._id) data._id = name
    try {
      for (var ver in data.versions) {
        readJson.processJson(data.versions[ver])
      }
    } catch (ex) {
      return log.er(cb, "error processing versions")(ex)
    }
    filterNodeVersion(data)
    npm.set(data)
    cb(null, data)
  })
}
// see if there is a satisfying version already
function findSatisfying (pkg, name, range, mustHave, reg) {
  if (mustHave) return null
  return semver.maxSatisfying
         ( Object.keys(reg[name] || {})
           .concat(Object.keys(Object.getPrototypeOf(reg[name] || {})))
         , range
         )
}

function finisher (pkg, reg, pkglist, cb) { return function (er, data) {
  if (er) return log.er(cb, "Error installing "+pkg)(er)
  if (!data._nodeSupported) cb(new Error(
    data.name+"@"+data.version+" not compatible with your version of node\n"+
    "Requires: node@"+data.engines.node+"\n"+
    "You have: node@"+process.version))

  if (!reg.hasOwnProperty(data.name)) {
    reg[data.name] = Object.create(reg[data.name] || Object.prototype)
  }
  if (!reg[data.name].hasOwnProperty(data.version)) {
    reg[data.name][data.version] = {}
  }
  reg[data.name][data.version] = data

  // also add the dependencies.
  var deps = getDeps(data)
  pkglist.push.apply(pkglist, Object.keys(deps).map(function (dep) {
    return dep.trim()+"@"+deps[dep]
  }))
  cb()
}}

function getDeps (data) {
  var deps = data.dependencies || {}
    , devDeps = data.devDependencies || {}
  if (npm.config.get("dev")) {
    Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })
  }
  return deps
}

function filterNodeVersion (data) {
  for (var v in data.versions) {
    if (!data.versions[v]._nodeSupported) {
      log.warn(data._id, "not supported on node@"+process.version)
      log.warn(data.engines, data._id+" supported engines:")
      delete data.versions[v]
    }
  }
}

function buildAll (installed, cb) {
  var list = []
  Object.keys(installed).forEach(function (i) {
    Object.keys(installed[i]).forEach(function (v) {
      list.push([i, v])
    })
  })
  log(list.map(function (i) { return i.join("@") }).join("\n"), "install")
  cb = rollbackFailure(list, cb)
  var buildList = []
  asyncMap(list, function (i, cb) {
    var target = path.join(npm.dir, i[0], i[1], "package")
    cache.unpack(i[0], i[1], target, cb)
    buildList.push(target)
  }, function (er) {
    if (er) return cb(er)
    log.verbose(list.join("\n"), "unpacked, building")
    npm.commands.build(buildList, cb)
  })
}
function rollbackFailure (installList, cb) { return function (er) {
  if (!er) return log.verbose(installList.map(function (i) {
    return i.join("@")
  }).join("\n"), "installed", cb)
  // error happened, roll back
  installList = installList.map(function (p) {
    return (""+p).replace(/\//, '@')
  })
  npm.ROLLBACK = true
  log.error(er, "install failed")
  log("rollback", "install failed")
  return npm.commands.uninstall
    ( installList
    , function (er_) {
        if (er_) log.error(er_, "rollback failed")
        else log("rolled back", "install failed")
        cb(er)
      }
    )
}}
