
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

function uninstall (args, cb) {
  var name = args.shift()
    , version = args.shift()
    , pkgdir = path.join(npm.dir, name, version)
    , jsonFile = path.join(pkgdir, "package", "package.json")
    , active = path.join(npm.dir, name, "active")
    , libdir = path.join(npm.root, name+"-"+version)
    , mainjs = libdir + ".js"
    , dependents = path.join(pkgdir, "dependents")

  // if active, then fail.
  chain
    ( [log, "about to remove: " + pkgdir, "uninstall"]
    , function (cb) {
        fs.readlink(active, function (er, active) {
        if (path.basename(active||"") === version) return cb(new Error(
          "cannot remove active package.\n"+
          "      npm deactivate "+name+" "+version+"\n"+
          "and then retry."))
        return cb()
      })}
    , [log, "not active", "uninstall"]
    // if has dependents, then fail
    , function (cb) {
        fs.readdir(dependents, function (er, children) {
        if (children && children.length) return cb(new Error(
          name+"-"+version+" depended upon by \n"+
          "      " + require("sys").inspect(children)+"\n"+
          "remove them first."))
        return cb()
      })}
    // remove the whole thing.
    , function (cb) { readJson(jsonFile, function (er, data) {
        if (er) return cb(er)
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
          , function (cb) { fs.readdir(pkgdir, function (versions) {
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
  var binroot = path.join(process.installPrefix, "bin")
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
