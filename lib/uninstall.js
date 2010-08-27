
// remove a package.  if it has dependents, then fail, and demand that they be
// uninstalled first.  If activee, then fail, and depand that it be deactivated
// first.

module.exports = uninstall

var rm = require("./utils/rm-rf")
  , fs = require("./utils/graceful-fs")
  , log = require("./utils/log")
  , readJson = require("./utils/read-json")
  , path = require("path")
  , npm = require("../npm")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , semver = require("./utils/semver")
  , readInstalled = require("./utils/read-installed")
  , mkdir = require("./utils/mkdir-p")
  , asyncMap = require("./utils/async-map")
  , loadPackageDefaults = require("./utils/load-package-defaults")

function uninstall (args, cb) {

  // for each arg:
  // unpack if no version found
  unpackArgs(args, function (er, args) {
    if (er) return cb(er)
    if (!args || !args.length) return cb()
    var rb = npm.ROLLBACK
    npm.ROLLBACK = true
    chain
      ( [firstPart, args]
      , [secondPart, args]
      , function (er) {
          npm.ROLLBACK = rb
          cb(er)
        }
      )
  })
}
function unpackArgs (rawArgs, cb) {
  readInstalled([], function (er, installed) {
    if (er) return cb(er)
    var args = []
      , argData = []
    rawArgs.forEach(function (arg) {
      arg = Array.isArray(arg) ? arg : arg.split("@")
      var ver = arg[1] || ""
        , pkg = arg[0] || ""
      arg = arg.join("@")
      if (!installed.hasOwnProperty(pkg)) return log(arg, "not installed")
      log.silly( Object.keys(installed[pkg]).join("\n"), "installed "+pkg)
      Object.keys(installed[pkg]).forEach(function (v) {
        if (semver.satisfies(v, ver)) args.push([pkg, v])
      })
    })
    ;(function R (arg) {
      if (!arg) return cb(null, argData)
      var jsonFile = path.join(npm.dir,arg[0],arg[1],"package","package.json")
      readJson( jsonFile
              , arg[1]
              , function (er, data) {
                if (er) return cb(er)
                  loadPackageDefaults(data, function (er, data) {
                    if (er) return cb(er)
                    data.version = arg[1]
                    data._id = data.name+"-"+data.version
                    argData.push(data)
                    argData[data._id] = data
                    R(args.pop())
                  })
                }
              )
    })(args.pop())
  })
}
function firstPart (args, cb) {
  asyncMap(args, function (arg, cb) {
    var pkgdir = path.join(npm.dir, arg.name, arg.version)
    chain
      ( [lifecycle, arg, "preuninstall"]
      , [lifecycle, arg, "uninstall"]
      , [checkActive, arg]
      , [checkDependents, arg, args]
      , [log, "safe to uninstall: "+arg._id, "uninstall"]
      , cb
      )
  }, log.er(cb, "Failed safety check"))
}
// if this package is active, and auto-deactivate isn't true, then fail
function checkActive (pkg, cb) {
  var version = pkg.version
    , name = pkg.name
    , active = path.join(npm.dir, name, "active")
  fs.readlink(active, function (er, active) {
    if (er) return cb() // nothing active
    if (path.basename(active||"") !== version) return cb() // not active
    if (!npm.config.get("auto-deactivate")) return cb(new Error(
      "cannot remove active package.\n"+
      "      npm deactivate "+name+"\n"+
      "and then retry."))
    pkg._active = true
    cb()
  })
}

// if anything depends on this package, which isn't already in the "others" list,
// then fail horribly.
function checkDependents (pkg, others, cb) {
  var depDir = path.join(npm.dir, pkg.name, pkg.version, "dependents")
  fs.readdir(depDir, function (er, deps) {
    if (er) return cb() // no dependents
    for (var i = 0, l = deps.length; i < l; i ++) {
      var dep = deps[i]
      // if this dependent is on the list, then it's ok,
      // because it'll be removed, too.
      if (!others[dep]) return cb(new Error(
        pkg.name+"@"+pkg.version+" depended upon by "+deps.join(",")+".\n"
        +"Cannot remove"))
    }
    cb()
  })
}

function secondPart (args, cb) {
  asyncMap(args, function (arg, cb) {
    var name = arg.name
    chain
      ( function (cb) {
          if (!arg._active) return cb()
          log.verbose("auto-deactivate", "uninstall "+arg._id)
          npm.commands.deactivate([name], log.er(cb,
              "Failed to deactivate"))
        }
      , [ asyncMap, [arg], function (arg, cb) {
            log.verbose("remove links", "uninstall "+arg._id)
            removeDependentLinks(arg, cb)
            removeLinkedDeps(arg, cb)
            log.verbose("remove bins", "uninstall "+arg._id)
            removeBins(arg, cb)
            rmMans(arg, cb)
            log.verbose("remove public modules", "uninstall "+arg._id)
            rm(path.join(npm.root, arg.name+"-"+arg.version), cb)
            rm(path.join(npm.root, arg.name+"-"+arg.version+".js"), cb)
          }, 6 ]
      , [ lifecycle, arg, "postuninstall" ]
      , [ log.verbose, "remove package dir", "uninstall "+arg._id]
      , [ rm, path.join(npm.dir, arg.name, arg.version) ]
      , function (cb) {
          fs.readdir(path.join(npm.dir, arg.name), function (er, vers) {
            if (er) return cb()
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
    rm(path.join( manroot
                , "man"+sxn
                , (bn.indexOf(pkg.name) === 0 ? bn
                  : pkg.name + "-" + bn)
                  + "-" + pkg.version
                  + "." + sxn + gz
                ), cb)
  }, cb)
}
function removeBins (data, cb) {
  if (!data.bin) return cb()
  var binroot = npm.config.get("binroot")
  asyncMap(Object.keys(data.bin), function (bin, cb) {
    if (!bin) return cb()
    rm(binroot + "/" + bin+"-"+data.version, cb)
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
      ;(function R (er) {
        if (er) return cb(er)
        var dep = deps.pop()
        if (!dep) return cb()
        // <3 symlinks
        rm(path.join( dependsOn
                    , dep
                    , "dependents"
                    , data.name+"-"+data.version
                    ), R)
      })()
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
  asyncMap(depLinks, function (dep, cb) {
    rm(dep, cb)
    rm(dep+".js", cb)
  }, 2, cb)
}
