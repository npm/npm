
// remove a package.  if it has dependents, then fail, and demand that they be
// uninstalled first.  If activee, then fail, and depand that it be deactivated
// first.

module.exports = uninstall

var rm = require("./utils/rm-rf")
  , fs = require("fs")
  , log = require("./utils/log")
  , readJson = require("./utils/read-json")
  , path = require("path")
  , npm = require("../npm")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , semver = require("./utils/semver")
  , readInstalled = require("./utils/read-installed")

function uninstall (args, cb) {
  var name = args.shift()
    , version = args.shift()
  
  if (name && !version) {
    // remove ALL versions.
    readInstalled([name], function (er, installed) {
      if (er) return log.er(cb,
        "Could not read installed data")(er)
      if (!installed || !installed[name]) return log(
        "Not installed ", "uninstall", cb)
      var versions = Object.keys(installed[name])
      log("removing all versions of "+name, "uninstall")
      ;(function R (ver) {
        log(ver, "multiremove")
        if (!ver) return cb()
        uninstall([name, ver], function (er) {
          if (er) return log.er(cb,
            "Couldn't remove version "+ver)(er)
          return R(versions.pop())
        })
      })(versions.pop())
    })
    return
  }
  var pkgdir = path.join(npm.dir, name, version)
    , jsonFile = path.join(pkgdir, "package", "package.json")
    , active = path.join(npm.dir, name, "active")
    , libdir = path.join(npm.root, name+"-"+version)
    , mainjs = libdir + ".js"
    , dependents = path.join(pkgdir, "dependents")

  chain
    ( [log, "about to remove: " + pkgdir, "uninstall"]
    , function (cb) {
        fs.readlink(active, function (er, active) {
          if (path.basename(active||"") !== version) return cb()
          else if (!npm.config.get("auto-deactivate")) return cb(new Error(
            "cannot remove active package.\n"+
            "      npm deactivate "+name+" "+version+"\n"+
            "and then retry."))
          else return log
            ( "removing active version: "+active, "uninstall"
            , function () { npm.commands.deactivate([name], log.er(cb,
                "Failed to deactivate"))}
            )
        })
      }
    // if has dependents, then fail
    , function (cb) {
        fs.readdir(dependents, function (er, children) {
        if (children && children.length) return cb(new Error(
          name+"-"+version+" depended upon by \n"+
          "      " + require("sys").inspect(children)+"\n"+
          "remove them first."))
        return cb()
      })}
    , [log, "checked deps", "uninstall"]
    // remove the whole thing.
    , function (cb) { readJson(jsonFile, function (er, data) {
        if (er) {
          log("Couldn't read json. Probably not installed", "uninstall")
          log(er, "uninstall")
          return cb()
        }
        data.version = version
        chain
          ( [lifecycle, data, "preuninstall"]
          , [lifecycle, data, "uninstall"]
          // clean out any dependent links, since this is going away.
          , [removeDependent, pkgdir, data]
          // clean out anything that's been linked in.  This is an ugly kludgey
          // awful artifact that is caused by linking stuff into the pkgdir
          , [removeLinkedDeps, pkgdir, data]
          , [rm, pkgdir]
          , [removeBins, data]
          , [rm, mainjs]
          , [rm, libdir]
          // if that was the last one, then remove the whole thing.
          , function (cb) { pkgdir = path.dirname(pkgdir); cb() }
          , function (cb) { fs.readdir(pkgdir, function (er, versions) {
              if (er) return log.er(cb, "failed to read " +pkgdir)(er)
              log(versions, "remaining")
              if (versions && versions.length) return cb()
              rm(pkgdir, cb)
            })}
          , [lifecycle, data, "postuninstall"]
          , cb
          )
      })}
    , cb
    )
}

function removeBins (data, cb) {
  log(data.bin, "remove bins")
  if (!data.bin) return cb()
  var binroot = npm.config.get("binroot")
  ;(function R (bins) {
    if (!bins.length) return cb()
    chain
      ( [rm, binroot + "/" + bins.pop()+"-"+data.version]
      , [rm, binroot + "/" + bins.pop()]
      , cb
      )
  })(Object.getOwnPropertyNames(data.bin))
}

function removeDependent (pkgdir, data, cb) {
  var dependencies = path.join(pkgdir, "dependencies")
  fs.readdir(dependencies, function (er, deps) {
    if (er) return cb(er)
    ;(function R () {
      var dep = deps.pop()
      if (!dep) return cb()
      dep = path.join(dependencies, dep)
      fs.readlink(dep, function (er, realdep) {
        if (er) return cb(er)
        var p = semver.parsePackage(path.basename(realdep, ".js"))
          , depPath = path.join(
              npm.dir, p[1], p[2], "dependents", data.name+"-"+data.version)
        log(depPath, "removeDependent")
        rm(depPath, R)
      })
    })()
  })
}

function removeLinkedDeps (pkgdir, data, cb) {
  if (!data.link) return cb()
  var depLinks = []
  for (var i in data.link) {
    depLinks.push(path.join(pkgdir, "package", data.link[i]))
  }
  ;(function R () {
    var dep = depLinks.pop()
    if (!dep) return cb()
    chain
      ( [rm, dep]
      , [rm, dep+".js"]
      , function (er, ok) {
          if (er) return cb(er)
          R()
        }
      )
  })()
}
