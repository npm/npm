'use strict'
var path = require('path')
var fs = require('graceful-fs')
var rimraf = require('rimraf')
var asyncMap = require('slide').asyncMap
var mkdirp = require('mkdirp')
var npm = require('../../npm.js')

// This is weird because we want to remove the module but not it's node_modules folder
// allowing for this allows us to not worry about the order of operations
module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('remove', pkg.path)
  var modpath = path.join(path.dirname(pkg.path), '.' + path.basename(pkg.path) + '.MODULES')

  fs.rename(path.join(pkg.path, 'node_modules'), modpath, unbuildPackage)

  function unbuildPackage (renameEr) {
    npm.commands.unbuild(pkg.path, renameEr ? andRemoveEmptyParents(pkg.path) : moveModulesBack)
  }

  function andRemoveEmptyParents (path) {
    return function (er) {
      if (er) return next(er)
      removeEmptyParents(pkg.path)
    }
  }

  function moveModulesBack () {
    fs.readdir(modpath, makeTarget)
  }

  function makeTarget (readdirEr, files) {
    if (readdirEr) return cleanup()
    if (!files.length) return cleanup()
    mkdirp(path.join(pkg.path, 'node_modules'), function (mkdirEr) { moveModules(mkdirEr, files) })
  }

  function moveModules (mkdirEr, files) {
    if (mkdirEr) return next(mkdirEr)
    asyncMap(files, function (file, done) {
      var from = path.join(modpath, file)
      var to = path.join(pkg.path, 'node_modules', file)
      // we ignore errors here, because they can legitimately happen, for instance,
      // bundled modules will be in both node_modules folders
      fs.rename(from, to, function () { done() })
    }, cleanup)
  }

  function cleanup () {
    rimraf(modpath, afterCleanup)
  }

  function afterCleanup (rimrafEr) {
    if (rimrafEr) log.warn('finalize', rimrafEr)
    removeEmptyParents(path.resolve(pkg.path, '..'))
  }

  function removeEmptyParents (pkgdir) {
    fs.rmdir(pkgdir, function (er) {
      if (er) return next()
      removeEmptyParents(path.resolve(pkgdir, '..'))
    })
  }
}
