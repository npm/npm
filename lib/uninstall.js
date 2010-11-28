
// remove a package.  if it has dependents, then fail, and demand that they be
// uninstalled first.  If activee, then fail, and depand that it be deactivated
// first.

module.exports = uninstall

uninstall.usage = "npm uninstall <name>[@<version> [<name>[@<version>] ...]"
                + "\nnpm rm <name>[@<version> [<name>[@<version>] ...]"

uninstall.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, true, cb)
}

var rm = require("./utils/rm-rf")
  , fs = require("./utils/graceful-fs")
  , log = require("./utils/log")
  , readJson = require("./utils/read-json")
  , path = require("path")
  , npm = require("../npm")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , semver = require("./utils/semver")
  , mkdir = require("./utils/mkdir-p")
  , asyncMap = require("./utils/async-map")
  , loadPackageDefaults = require("./utils/load-package-defaults")

function uninstall (args, cb) {
  // for each arg:
  // unpack version ranges (empty version is like "*", remove all)
  // if in recursive mode, then also add dependents at this stage.
  // this way, it won't whine about not being able to remove anything, ever.
  unpackArgs(args, function (er, args) {
    if (args.length) log.verbose(args, "removing")
    if (er) return cb(er)
    if (!args || !args.length) return cb()
    var rb = npm.ROLLBACK
    npm.ROLLBACK = true
    function cb_ (er, removed) {
      npm.ROLLBACK = rb
      return cb(er, removed)
    }
    verifySafety(args, function (er, data) {
      if (er) return cb_(er, data)
      log.silly(data, "data")
      // now "data" is an array of packages to remove.
      // all of them exist and are safe to delete.
      secondPart(data, cb_)
    })
  })
}

// if any deps are found, and are valid (have a package.json),
// and are not also on the list, then yell about it.
// while we're at it, read the json here so that the secondPart
// gets the data necessary to actually remove stuff.
function verifySafety (args, cb) {
  var force = npm.config.get("force")
    , removeList = {}
  args.forEach(function (arg) { removeList[arg.join("@")] = true })
  asyncMap(args, function (pv, cb) {
    getDependents(pv, function (er, deps) {
      var pkg = pv.join("@")
      asyncMap(deps, function (dep, cb) {
        if (removeList[dep]) {
          return cb() // already going to be removed, ignore it.
        }
        // read the package.json file
        dep = dep.split("@")
        var depName = dep[0]
          , depVer = dep.slice(1).join("@")
          , jsonFile = path.join( npm.dir, depName, depVer
                                , "package", "package.json"
                                )
        readJson( jsonFile
                , { tag : depVer }
                , function (er, data) {
                    // ignore anything that doesn't have a valid package.json
                    // it's not a real dep, just a stray link from a historical bug.
                    if (data) data.version = depVer
                    return (er) ? cb() : cb(null, data)
                  }
                )
      }, function (er, depData) {
        // if there's anything in depData, and we're not forcing, then fail
        if (er) return cb(er)
        var depNames = depData.map(function (d) { return d._id })
        if (depNames.length) {
          if (force) {
            log.warn( "These packages depend on "+pkg+" and may cease to function"
                    , "forced uninstall"
                    )
            log.warn(depNames.join("\n"), "forced uninstall")
          } else return cb(new Error(pkg+" depended upon by "+depNames.join(",")+".\n"
                                    +"Cannot remove"))
        }
        var jsonFile = path.join( npm.dir, pv[0], pv[1]
                                , "package", "package.json" )
        readJson(jsonFile, { tag : pv[1] }, function (er, data) {
          if (data) data.version = pv[1]
          cb(er, data)
        })
      })
    })
  }, cb)
}


function unpackArgs (rawArgs, cb) {
  var recursive = npm.config.get("recursive")
    , seen = {}
  asyncMap(rawArgs, function (arg, cb) {
    if (!arg) return cb()
    arg = Array.isArray(arg) ? arg : arg.split("@")
    var pkg = arg[0]
      , ver = arg.slice(1).join("@")
    if (!pkg) return log.warn(arg, "bad arg", cb)
    arg = arg.join("@")
    if (semver.validRange(ver) === null) {
      return log.warn(ver, "bad version/range", cb)
    }
    fs.readdir(path.join(npm.dir, pkg), function (er, vers) {
      if (er) return log(arg, "not installed", cb)
      var pvs = selectVersions(pkg, vers, ver).filter(function (pv) {
        pv = pv.join("@")
        return (seen.hasOwnProperty(pv)) ? false : seen[pv] = true
      })
      if (!recursive) cb(null, pvs)
      else selectDependents(pvs, function (er, deps) {
        if (er) return cb(er)
        if (deps.length) {
          log.warn("Removing packages that depend on "+arg, "recursive uninstall")
          log.verbose(deps, "recursive uninstall")
          rawArgs.push.apply(rawArgs, deps)
        }
        cb(null, pvs)
      })
    })
  }, cb)
}
function selectDependents (pvs, cb) { asyncMap(pvs, getDependents, cb) }
function getDependents (pv, cb) {
  fs.readdir(path.join(npm.dir, pv[0], pv[1], "dependents"), function (er, deps) {
    // error means no dependents, most likely
    cb(null, deps || [])
  })
}
function selectVersions (pkg, versions, range) {
  return versions.filter(function (v) {
    return semver.satisfies(v, range)
  }).map(function (v) {
    return [pkg, v]
  })
}

function secondPart (args, cb) {
  log.silly(args, "uninstall secondPart")
  asyncMap(args, function (arg, cb) {
    var name = arg.name
    chain
      ( [lifecycle, arg, "preuninstall"]
      , [lifecycle, arg, "uninstall"]
      , function (cb) {
          // get the active version
          var active = path.join(npm.dir, arg.name, "active")
          fs.lstat(active, function (er, s) {
            if (er || !s.isSymbolicLink()) return log("not symlink", "auto-deactive", cb)
            fs.readlink(active, function (er, ver) {
              if (er || ver !== "./" + arg.version) return cb()
              if (!npm.config.get("auto-deactivate")) return cb(new Error(
                "cannot remove active package.\n"+
                "      npm deactivate "+name+"\n"+
                "and then retry."))
              log.verbose("auto-deactivate", "uninstall "+arg._id)
              npm.commands.deactivate([name], log.er(cb,
                "Failed to deactivate "+name))
            })
          })
        }
      , [ asyncMap, [arg]
        , function (a, cb) { log.verbose("remove links", "uninstall "+a._id, cb) }
        , removeDependentLinks
        , removeLinkedDeps
        , function (a, cb) { log.verbose("remove bins", "uninstall "+a._id, cb) }
        , removeBins
        , rmMans
        , function (a, cb) { log.verbose("remove public modules", "uninstall "+a._id, cb) }
        // todo: remove this kludge v0.1.28
        , function (arg, cb) {
            rm(path.join(npm.root, arg.name+"-"+arg.version), cb)
          }
        // todo: remove this kludge v0.1.28
        , function (arg, cb) {
            rm(path.join(npm.root, arg.name+"-"+arg.version+".js"), cb)
          }
        , function (arg, cb) {
            rm(path.join(npm.root, arg.name+"@"+arg.version), cb)
          }
        , function (arg, cb) {
            rm(path.join(npm.root, arg.name+"@"+arg.version+".js"), cb)
          }
        ]
      , [ lifecycle, arg, "postuninstall" ]
      , [ log.verbose, "remove package dir", "uninstall "+arg._id]
      , [ rm, path.join(npm.dir, arg.name, arg.version) ]
      , function (cb) {
          fs.readdir(path.join(npm.dir, arg.name), function (er, vers) {
            if (er) return cb()
            vers = vers.filter(function (v) { return v !== "active" })
            if (vers.length > 0) return cb()
            // remove the root of this package.
            rm(path.join(npm.dir, arg.name), cb)
          })
        }
      , [log, "complete", "uninstall "+arg._id]
      , cb
      )
  }, cb)
}
function rmMans (pkg, cb) {
  var manroot = npm.config.get("manroot")
  if (!pkg.man || !manroot) return cb()
  asyncMap(pkg.man, function (man, cb) {
    var parseMan = man.match(/(.*)\.([0-9]+)(\.gz)?$/)
      , stem = parseMan[1]
      , sxn = parseMan[2]
      , gz = parseMan[3] || ""
      , bn = path.basename(stem)
      , mp = path.join( manroot
                      , "man"+sxn
                      , (bn.indexOf(pkg.name) === 0 ? bn
                        : pkg.name + "-" + bn)
                      )
      , suff = pkg.version + "." + sxn + gz
    // todo: remove this kludge v0.1.28
    // just do the "@" only.
    asyncMap([mp+"-"+suff, mp+"@"+suff], rm, cb)
  }, cb)
}
function removeBins (data, cb) {
  if (!data.bin) return cb()
  var binroot = npm.config.get("binroot")
  asyncMap(Object.keys(data.bin), function (bin, cb) {
    if (!bin) return cb()
    var p = binroot + "/" + bin
      , v = data.version
    // todo: remove this kludge v0.1.28
    // just do the "@" only.
    asyncMap([p+"@"+v, p+"-"+v], rm, cb)
  }, cb)
}
function removeDependentLinks (data, cb) {
  var dependsOn = path.join(npm.dir, data.name, data.version, "dependson")
  // TODO: remove this mkdir kludge
  // A workaround for the fact that this dir didn't exist prior to 0.1.20
  mkdir(dependsOn, function (er) {
    if (er) return cb() // meh
    fs.readdir(dependsOn, function (er, deps) {
      if (er) return cb(er)
      asyncMap(deps, function (dep, cb) {
        // <3 symlinks
        var p = path.join(dependsOn, dep, "dependents", data.name)
          , v = data.version
        // todo: remove this kludge v0.1.28
        // just do the "@" only.
        asyncMap([p+"@"+v, p+"-"+v], rm, cb)
      }, cb)
    })
  })
}

function removeLinkedDeps (data, cb) {
  if (!data.link) return cb()
  var depLinks = []
    , pkgdir = path.join(npm.dir, data.name, data.version)
  for (var i in data.link) {
    depLinks.push(path.join(pkgdir, "package", data.link[i]))
  }
  asyncMap( depLinks
          , rm
          , function (d, c) { rm(d+".js", c) }
          , cb
          )
}
