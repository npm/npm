
// Walk through the file-system "database" of installed
// packages, and create a data object related to the
// installed/active versions of each package.

var npm = require("../../npm")
  , fs = require("./graceful-fs")
  , path = require("path")
  , asyncMap = require("./async-map")
  , semver = require("semver")
  , readJson = require("./read-json")

module.exports = readInstalled

function readInstalled (args, verbose, cb) {
  if (typeof cb !== "function") cb = verbose, verbose = false
  var showAll = args.length === 0
    , data = {}
  fs.readdir(npm.dir, function (er, packages) {
    // if an error, just assume nothing is installed.
    if (er) return cb(null, {})
    packages = packages.filter(function (dir) {
      return (showAll || args.indexOf(dir) !== -1) && dir.charAt(0) !== "."
    })
    var pkgDirs = {}
    packages.forEach(function (p) {
      pkgDirs[p] = path.join(npm.dir, p)
      data[p] = {}
    })

    asyncMap(packages, function (package, cb) {
      var active = path.join(pkgDirs[package], "active")
      fs.lstat(active, function (er, s) {
        if (er || !s.isSymbolicLink()) return cb()
        fs.readlink(active, function (er, p) {
          if (er) return cb(er)
          var activeVersion = path.basename(p)
          data[package][activeVersion] = data[package][activeVersion] || {}
          data[package][activeVersion].active = true
          return cb()
        })
      })
    }, function (package, cb) {
      fs.readdir(pkgDirs[package], function (er, versions) {
        if (er) {
          delete data[package]
          return cb() // skip over non-dirs or missing things.
        }
        asyncMap(versions, function (version, cb) {
          if (semver.valid(version) && verbose) {
            data[package][version] = data[package][version] || {}
            return readJson( path.join( npm.dir, package, version
                                      , "package", "package.json" )
                           , function (er, d) {
              if (er) return cb();
              for (var s in d) {
                data[package][version][s] = d[s]
              }
              cb()
            })
          }
          cb()
        }, cb)
      })
    }, function (er) {
      // just return the data object we've created.
      cb(er, data)
    })
  })
}
