'use strict'
var fs = require('fs')
var path = require('path')
var chain = require('slide').chain
var rmStuff = require('../../unbuild.js').rmStuff
var lifecycle = require('../../utils/lifecycle.js')
var finalize = require('./finalize.js')
var updatePackageJson = require('../update-package-json')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('move', pkg.fromPath, pkg.path)
  chain([
    [lifecycle, pkg.package, 'preuninstall', pkg.path, false, true],
    [lifecycle, pkg.package, 'uninstall', pkg.path, false, true],
    [rmStuff, pkg.package, pkg.path],
    [lifecycle, pkg.package, 'postuninstall', pkg.path, false, true],
    [finalize, top, pkg.fromPath, pkg, log],
    [removeEmptyParents, path.resolve(pkg.fromPath, '..')],
    [updatePackageJson, pkg, pkg.path]
  ], next)
}

function removeEmptyParents (pkgdir, next) {
  _removeEmptyParents()
  next()
  function _removeEmptyParents () {
    fs.rmdir(pkgdir, function (er) {
      if (er) return
      _removeEmptyParents(path.resolve(pkgdir, '..'))
    })
  }
}
