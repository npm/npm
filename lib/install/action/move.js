'use strict'
var fs = require('fs')
var path = require('path')
var chain = require('slide').chain
var rmStuff = require('../../unbuild.js').rmStuff
var lifecycle = require('../../utils/lifecycle.js')
var finalize = require('./finalize.js')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('move', pkg.fromPath, pkg.path)
  chain([
    [lifecycle, pkg.package, 'preuninstall', pkg.path, false, true],
    [lifecycle, pkg.package, 'uninstall', pkg.path, false, true],
    [rmStuff, pkg.package, pkg.path],
    [lifecycle, pkg.package, 'postuninstall', pkg.path, false, true]
  ], function () {
    finalize(top, pkg.fromPath, pkg, log, function () { removeEmptyParents(path.resolve(pkg.fromPath, '..')) })

  })
  function removeEmptyParents (pkgdir) {
    fs.rmdir(pkgdir, function (er) {
      if (er) return next()
      removeEmptyParents(path.resolve(pkgdir, '..'))
    })
  }
}
