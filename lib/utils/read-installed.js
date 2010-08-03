
// Walk through the file-system "database" of installed
// packages, and create a data object related to the
// installed/active versions of each package.

var npm = require("../../npm")
  , fs = require("fs")
  , path = require("path")
  , log = require("./log")
  , mkdir = require("./mkdir-p")

module.exports = readInstalled

function readInstalled (args, cb) {
  var showAll = args.length === 0
  fs.readdir(npm.dir, function (er, packages) {
    if (er) return cb(er)
    packages = packages.filter(function (dir) {
      return (showAll || args.indexOf(dir) !== -1) && dir.charAt(0) !== "."
    })
    // maybe nothing found
    if (!packages.length) cb(null, [])

    var p = packages.length
      , data = {}
    function listed () { if (--p === 0) cb(null, data) }
    packages.forEach(function (package) {
      var packageDir = path.join(npm.dir, package)
        , activeVersion = null
      data[package] = data[package] || {}
      fs.readdir(packageDir, function (er, versions) {
        if (er) return cb(er)
        ;(function V () {
          var version = versions.pop()
          if (activeVersion && data[package][activeVersion]) {
            data[package][activeVersion].active = true
          }
          if (!version || version.charAt(0) === ".") return listed()
          if (version !== "active") {
            data[package][version] = data[package][version] || {}
            return process.nextTick(V)
          }
          var active = path.join(packageDir, "active")
          fs.lstat(active, function (er, s) {
            if (!s.isSymbolicLink()) {
              data[package][version] = data[package][version] || {}
              return process.nextTick(V)
            }
            fs.readlink(active, function (er, p) {
              if (er) return cb(er)
              activeVersion = path.basename(active)
              return process.nextTick(V)
            })
          })
        })()
      })
    })
  })
}
