
module.exports = loadPackageDefaults

var path = require("path")
  , log = require("./log")
  , find = require("./find")
  , asyncMap = require("./async-map")
  , npm = require("../../npm")

function loadPackageDefaults (pkg, cb) {
  asyncMap([pkg], function (pkg, cb) {
    readDefaultModules(pkg, cb)
    readDefaultBins(pkg, cb)
  }, 2, function (er) { cb(er, pkg) })
}

// shim ROOT/{name}-{version}/**/*.js to ROOT/.npm/{name}/{version}/{lib}/**/*.js
function readDefaultModules(pkg, cb) {
  log.verbose("linking default modules", pkg._id)
  var lib = pkg.directories && pkg.directories.lib || pkg.lib
    , pkgDir = path.join(npm.dir, pkg.name, pkg.version, "package")
    , libDir = path.join(pkgDir, lib)
  if (pkg.modules || !lib) return cb(null, pkg)
  // create a modules hash from the lib folder.
  pkg.modules = {}
  find(libDir, /\.(js|node)$/, function (er, filenames) {
    if (er) return cb(er)
    filenames.forEach(function (filename) {
      filename = path.basename(filename, path.extname(filename))
      pkg.modules[filename.substr(libDir.length + 1)] =
        filename.substr(pkgDir.length + 1)
    })
    return cb(null, pkg)
  })
}
function readDefaultBins (pkg, cb) {
  var binDir = pkg.directories && pkg.directories.bin
  log.silly(pkg, binDir)
  if (pkg.bin || !binDir) return cb(null, pkg)
  log.verbose("linking default bins", pkg._id)
  var pkgDir = path.join(npm.dir, pkg.name, pkg.version, "package")
  binDir = path.join(pkgDir, binDir)
  pkg.bin = {}
  find(binDir, function (er, filenames) {
    log.silly(filenames, "default bins")
    if (er) return cb(er)
    filenames.forEach(function (filename) {
      var key = filename.substr(binDir.length + 1)
                        .replace(/\.(js|node)$/, '')
      pkg.bin[key] = filename.substr(pkgDir.length + 1)
    })
    log.silly(pkg.bin, pkg._id+".bin")
    cb(null, pkg)
  })
}

