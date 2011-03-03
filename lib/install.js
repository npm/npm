
// npm install <pkg> <pkg> <pkg>
// npm install <pkg@version> <pkg@"1.0.0 - 1.99.99"> <pkg[@latest]> <pkg@tagname>

// ALGORITHM 1: Deeper, more repetition, easier to update, faster runtime lookups
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// for each dep@version in what.dependencies
//     not in previously
//     and not in where/node_modules/what/node_modules
//   install(where/node_modules/what, dep, previously + what)
//
// ALGORITHM 2: Disk efficient, less repetition, more sharing.
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// for each dep@version in what.dependencies
//     not in where/nm/what/nm/*
//     and not in previously
//   install(where/node_modules/what, dep, previously+precise version deps)
//
// ALGORITHM 3: Most disk efficient, minimum repetition. "Squash left"
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// list1 = [], list2 = []
// for each dep@version in what.dependencies
//     and not in where/nm/what/nm/*
//     and not in previously
//   if dep not in where/node_modules
//     add dep to list1
//   else add dep to list2
// for each dep@version in list1
//   install(where, dep@version, previously+list1)
// for each dep@version in list2
//   install(where, dep@version, previously+list1+list2)
//
// For package{dep} structure: A{B,C}, B{C}, C{D}
//
// Algorithm 1 produces:
// A
// +-- B
// |   `-- C
// |       `-- D
// `-- C
//     `-- D
//
// Algorithm 2 produces:
// A
// +-- B
// `-- C
//     `-- D
//
// Algorithm 3 produces:
//
// A
// +-- B
// +-- C
// `-- D
//
// At first glance, 2 is clearly better.  However, if A wants to update to
// C', which conflicts with B's dependency on C, then the update algorithm
// must be clever enough to detect this, and install C directly in B.  With
// installation algorithm 1, the update process simply detects that B will
// not be satisfied by C', and leave it alone.
//
// Even though it makes updating slightly more complicated, that complication
// is unavoidable.  `npm update` should always be smart enough to detect
// and prevent contract breakage, even if it was the result of some manual
// intervention.
//
// Algorithm 3 looks nice but is obnoxious.  It's very likely that old deps
// will be left behind when things are removed, even if they're no longer
// necessary, and detecting that will be tricky.  With algo2, however,
// removing C will require a check to make sure that no other packages
// are depending on it.
//
// Conclusion: Use algorithm 1.  Switching is easy anyway.
//
// Managing "previously" lists...
// every time we dive into a deeper node_modules folder, the "previously"
// list that gets passed along uses the previous "previously" list as
// it's __proto__.  Any "resolved precise dependency" things that aren't
// already on this object get added, and then that's passed to the next
// generation of installation.

module.exports = install

install.usage = "npm install <tarball file>"
              + "\nnpm install <tarball url>"
              + "\nnpm install <folder>"
              + "\nnpm install <pkg>"
              + "\nnpm install <pkg>@<tag>"
              + "\nnpm install <pkg>@<version>"
              + "\nnpm install <pkg>@<version range>"
              + "\n\nCan specify one or more: npm install ./foo.tgz bar@stable /some/folder"
              + "\nInstalls dependencies in ./package.json if no argument supplied"

install.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, true, true, true, cb)
}

var registry = require("./utils/registry")
  , npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , installedPackages
  , semver = require("semver")
  , url = require("url")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , cache = require("./cache")
  , asyncMap = require("./utils/async-map")
  , chain = require("./utils/chain")

function install (args, cb) {
  // install dependencies locally by default,
  // or install current folder globally
  if (!args.length) {
    if (npm.config.get("global")) args = ["."]
    else return readJson(path.resolve("package.json"), function (er, data) {
      if (er) return log.er(cb, "Couldn't read dependencies.")(er)
      var deps = Object.keys(data.dependencies || {})
      if (!deps.length) return log("Nothing to do", "install", cb)
      install(deps.map(function (dep) {
        return dep+"@"+data.dependencies[dep]
      }), cb)
    })
  }

  var where = npm.config.get("global")
            ? path.resolve(npm.config.get("prefix"), "node_modules")
            : path.resolve("node_modules")

  // initial "previously" is the name:version of the root, if it's got
  // a pacakge.json file.
  readJson(path.resolve(where, "package.json"), function (er, data) {
    if (er) data = null
    var previously = {}
    if (data) previously[data.name] = data.version
    installMany(args, where, previously, cb)
  })
}

function installMany (what, where, previously, cb) {
  log.info(what, "into "+where)
  // what is a list of things.
  // resolve each one.
  asyncMap(what, targetResolver(where, previously), function (targets, cb) {
    // each target will be a data object corresponding
    // to a package, folder, or whatever that is in the cache now.
    log.info(target._id, "(resolved) into "+where)
    asyncMap(targets, function (target, cb) {
      installOne(target, where, previously, cb)
    }, cb)
  })
}

function targetResolver (where, previously) {
  var alreadyInstalledManually = null
    , nm = path.resolve(where, "node_modules")
  fs.readdir(nm, function (er, inst) {
    if (er) return alreadyInstalledManually = []
    asyncMap(inst, function (i, cb) {
      isTouched(path.resolve(nm, i), function (er, touched) {
        if (er || !touched) return cb(null, i)
        else return cb(null , [])
      })
    }, function (er, list) {
      if (er) return cb(er)
      alreadyInstalledManually = list
    })
  })
  var to = 0
  return function resolver (what, cb) {
    if (!alreadyInstalledManually) return setTimeout(function () {
      resolver(what, cb)
    }, to++)
    // now we know what's been installed here manually,
    // or tampered with in some way that npm doesn't want to overwrite.
    if (alreadyInstalledManually.indexOf(what) !== -1) return cb(null, [])
    cache.add(what, function (er, data) {
      if (!er && data && previously[data.name] === data.version) {
        return cb(null, [])
      }
      return cb(er, data)
    })
  }
}

function installOne (target, where, previously, cb) {
  var targetFolder = path.resolve(where, "node_modules/"+target.name)
    , up = !npm.config.get("global") || npm.config.get("unsafe-perm")
    , user = up ? null : npm.config.get("user")
    , group = up ? null : npm.config.get("group")
  chain
    ( [ rm, targetFolder ]
    , [ cache, "unpack", target.name, target.version, targetFolder
      , null, null, user, group ]
    , function (cb) {
        var deps = Object.keys(target.dependencies || {})
        if (!deps.length) return cb()

        var newP = Object.create(previously)
          , newWhere = path.resolve(targetFolder, "node_modules")

        newP[target.name] = target.version
        installMany(deps.map(function (d) {
          return d + "@" + target.dependencies[d]
        }), newWhere, newPrev, cb)
      }
    , cb
    )
}





//function install (pkglist, cb) {
//  log.verbose(pkglist, "install")
//  if (pkglist.length === 0) pkglist = ["."]
//  // it's helpful to know what we have already
//  if (!installedPackages) return readInstalled([], function (er, data) {
//    if (er) return cb(er)
//    installedPackages = data || {}
//    install(pkglist, cb)
//  })
//
//  log.verbose(pkglist, "install pkglist")
//  var mustInstall = npm.config.get("must-install") ? pkglist.slice(0) : []
//
//  // three lists: "pkglist", "next", and "reg"
//  // asyncMap over the "left" list: for each "it"
//  //   find out what it is
//  //   if it's version/range installed or on "reg" list, continue.
//  //   if it's a url, fetch to cache and add the name/version to "next"
//  //   if it's a tag, fetch the json, add the version to "next"
//  //   if it's a version(range) not installed, then fetch the json,
//  //     add url to "next"
//  //   if it's a specific version in cache, then unpack, add to "reg"
//  //     list, add its deps to "next"
//  // if the "next" list is not empty, then pkglist=next,next=[], and repeat.
//  // if it is, then build all the "reg" folders.
//
//  var reg = Object.create(installedPackages)
//    , seen = {}
//    , bundles = {}
//  log.verbose(mustInstall, "must install")
//  asyncMap(pkglist, function (pkg, cb) {
//    install_(pkg, reg, seen, mustInstall.indexOf(pkg) !== -1,
//             pkglist, bundles, cb)
//  }, function (er) {
//    if (er) return cb(er)
//    buildAll(reg, bundles, cb)
//  })
//}
//
//// call the cb with the "next" thing(s) to look up for this one, or nothing
//function install_ (pkg, reg, seen, mustHave, pkglist, bundles, cb) {
//  log.verbose(pkg, "install_")
//  if (seen[pkg]) return cb() // repeat, skip it
//  seen[pkg] = true
//
//  // it's a local thing or a url if it has a / in it.
//  if (pkg.indexOf("/") !== -1 || pkg === ".") {
//    log.silly(pkg, "install local")
//    return cache.add(pkg, finisher(pkg, reg, pkglist, bundles, cb))
//  }
//
//  // now we know it's not a URL or file,
//  // so handle it like a tag, version, or range.
//  pkg = pkg.split("@")
//  var name = pkg[0]
//    , defTag = npm.config.get("tag")
//    , ver = pkg.slice(1).join("@").trim() || defTag
//    , range = semver.validRange(ver)
//    , exact = semver.valid(ver)
//    , tag = !exact && !range && range !== "" && ver
//  log.verbose([pkg, mustHave], "must install?")
//  pkg = pkg.join("@")
//  seen[name+"@"+ver] = true
//
//  // if there is a satisfying version already, then simply move on.
//  if (!tag && findSatisfying(pkg, name, range, mustHave, reg)) {
//    return cb()
//  }
//
//  // at this point, assume that it has to be installed.
//  if (exact) {
//    log.verbose("exact", pkg)
//    // just pull the data out of the cache to ensure it's there
//    return cache.read(name, exact, finisher(pkg, reg, pkglist, bundles, cb))
//  }
//
//  getData(name, function (er, data) {
//    if (er) return cb(er)
//    log.silly(data, pkg)
//    if (tag) {
//      log.verbose(tag, pkg+" tag")
//      var tags = data["dist-tags"]
//      if (!tags[tag]) cb(new Error(
//        "Tag not found: "+data.name+"@"+tag
//        +"\nValid install targets for "+data.name+": "
//        +installTargets(data)))
//      install_(data.name+"@"+tags[tag], reg, seen, mustHave
//              , pkglist, bundles, cb)
//    } else {
//      log(pkg, "range")
//      // prefer the default tag version.
//      var defTag = npm.config.get("tag")
//        , satis
//      defTag = defTag && data["dist-tags"] && data["dist-tags"][defTag]
//      if (semver.satisfies(defTag, range)) satis = defTag
//      else satis = semver.maxSatisfying(Object.keys(data.versions), range)
//
//      if (!satis) return cb(new Error(
//        "No satisfying version found for '"+data.name+"'@'"+range+"'"
//        +"\nValid install targets for "+data.name+": "
//        +installTargets(data)))
//      install_(data.name+"@"+satis, reg, seen, mustHave
//              , pkglist, bundles, cb)
//    }
//  })
//}
//function installTargets (data) {
//  return Object.keys(data["dist-tags"] || {})
//    .concat(Object.keys(data.versions))
//    .map(JSON.stringify)
//    .join(", ") || "(none)"
//}
//
//function getData (name, cb) {
//  var data = npm.get(name)
//  if (data && data["dist-tags"]) return cb(null, data)
//  registry.get(name, function (er, data) {
//    if (er) return cb(er)
//    if (!data._id) data._id = name
//    for (var ver in data.versions) {
//      try {
//        readJson.processJson(data.versions[ver])
//      } catch (ex) {
//        log(data.name+"@"+ver, "ignoring invalid version")
//        delete data.versions[ver]
//      }
//    }
//    if (!data["dist-tags"]) return cb(new Error(
//      (data._id || data.name) +
//      " Invalid package data. Lacking 'dist-tags' hash."))
//    filterNodeVersion(data)
//    npm.set(data)
//    cb(null, data)
//  })
//}
//// see if there is a satisfying version already
//function findSatisfying (pkg, name, range, mustHave, reg) {
//  if (mustHave) return null
//  return semver.maxSatisfying
//         ( Object.keys(reg[name] || {})
//           .concat(Object.keys(Object.getPrototypeOf(reg[name] || {})))
//         , range
//         )
//}
//
//function finisher (pkg, reg, pkglist, bundles, cb) {
//    return function (er, data) {
//  if (!cb) throw new Error("no cb in finisher")
//  if (er) return log.er(cb, "Error installing "+pkg)(er)
//  if (!data._engineSupported) return cb(
//    data.name+"@"+data.version
//    +" not compatible with this version of node/npm\n"
//    +"Requires: "+JSON.stringify(data.engines)+"\n"
//    +"You have: "+JSON.stringify({node:process.version, npm:npm.version}))
//
//  if (!reg.hasOwnProperty(data.name)) {
//    reg[data.name] = Object.create(reg[data.name] || Object.prototype)
//  }
//  reg[data.name][data.version] = data
//
//  // also add the dependencies.
//  // any dependencies that are URLs get added to a bundle list
//  if (!pkglist) pkglist = []
//  getDeps(data, function (er, deps) {
//    if (er) return cb(er)
//    if (!Array.isArray(pkglist)) pkglist = [pkglist]
//    pkglist.push.apply(pkglist, Object.keys(deps).map(function (dep) {
//      var v = deps[dep].trim()
//        , d = dep.trim()
//        , u = url.parse(v)
//      log.silly(u, "url.parse "+v)
//      if (u && u.protocol && u.host) {
//        bundles[data._id] = bundles[data._id] || []
//        bundles[data._id].push(u.href)
//        return false
//      }
//      return v ? d + "@" + v : d
//    }).filter(function (dep) { return dep }))
//    cb()
//  })
//}}
//
//function getDeps (data, cb) {
//  var deps = data.dependencies || {}
//    , devDeps = data.devDependencies || {}
//  if (npm.config.get("dev")) {
//    Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })
//  }
//  // now see if any of them are already bundled.
//  // if so, omit them from the list.
//  var bundle = path.join( npm.cache, data.name, data.version
//                        , "package", "node_modules" )
//  fs.readdir(bundle, function (er, bundles) {
//    bundles = bundles || []
//    bundles.forEach(function (b) { delete deps[b] })
//    cb(null, deps)
//  })
//}
//
//function filterNodeVersion (data) {
//  var supported = []
//  Object.keys(data.versions).forEach(function (v) {
//    if (!data.versions[v]._engineSupported) {
//      log.verbose(data.versions[v]._id, "not supported on node@"+process.version)
//      delete data.versions[v]
//    } else supported.push(data.versions[v]._id)
//  })
//  if (!supported.length) {
//    log.warn(data._id, "Not supported on node@"+process.version)
//  } else log.verbose(supported, "Supported versions")
//  // might have deleted the special "latest" tag.  if so, replace it.
//  var v = data["dist-tags"].latest
//  if (v && !data.versions[v] && supported.length) {
//    data["dist-tags"].latest = Object.keys(data.versions)
//      .sort(semver.compare).pop()
//    log("not supported by node@"+process.version,
//        "latest = "+data.name+"@"+v)
//  }
//}
//
//function buildAll (installed, bundles, cb) {
//  var list = []
//  Object.keys(installed).forEach(function (i) {
//    Object.keys(installed[i]).forEach(function (v) {
//      list.push([i, v])
//    })
//  })
//  log.verbose(list, "install list")
//  cb = rollbackFailure(list, cb)
//  if (!list.length) return log.info("Nothing to do", "install", cb)
//  var buildList = []
//    , up = npm.config.get("unsafe-perm")
//
//  asyncMap(list, function (i, cb) {
//    var target = path.join(npm.dir, i[0], i[1])
//    cache.unpack( i[0], i[1], target
//                , null, null // don't chmod anything here.  just as-is.
//                , up ? null : npm.config.get("user")
//                , up ? null : npm.config.get("group"), function (er) {
//      if (!er) buildList.push(target)
//      cb(er)
//    })
//  }, function (er) {
//    if (er) return cb(er)
//    log.verbose(list.join("\n"), "unpacked, building")
//    // now everything's been unpacked.
//    // install any bundles that were requested with a url dep.
//    // MUST install ALL bundles before building anything
//    log.silly(bundles, "installing bundles")
//    chain( [installBundles, bundles]
//         , [npm.commands.build, buildList]
//         , cb )
//  })
//}
//
//function installBundles (bundles, cb) {
//  // bundles is {name:[some, pkg, urls],...}
//  // bundle install each of them one at at time.
//  // This global config state thing sucks a lot. Need
//  // a more clean FP-style approach to the whole bundle thing.
//  var bundlePkgs = Object.keys(bundles)
//  if (!bundlePkgs.length) return cb()
//  chain(bundlePkgs.map(function (host) { return function (cb) {
//    var urls = bundles[host]
//      , _ = host.split("@")
//      , name = _.shift()
//      , ver = _.join("@")
//      , pkgDir = path.join(npm.dir, name, ver, "package")
//    log.info(urls, "bundling for "+host)
//    npm.commands.bundle(["install"].concat(urls), pkgDir, cb)
//  }}).concat(cb))
//}
//
//function rollbackFailure (installList, cb) { return function (er) {
//  if (!er) return log.verbose(installList.map(function (i) {
//    return i.join("@")
//  }).join("\n"), "installed", cb)
//  // error happened, roll back
//  installList = installList.map(function (p) {
//    return p.join('@')
//  })
//  npm.ROLLBACK = true
//  log.error(er, "install failed")
//
//  if (!npm.config.get("rollback")) {
//    return cb(er)
//  }
//
//  log("rollback", "install failed")
//  log(installList, "uninstall")
//  return npm.commands.uninstall
//    ( installList
//    , function (er_) {
//        if (er_) log.error(er_, "rollback failed")
//        else log("rolled back", "install failed")
//        cb(er)
//      }
//    )
//}}
