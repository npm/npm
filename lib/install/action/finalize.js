'use strict'
var path = require('path')
var rimraf = require('rimraf')
var fs = require('graceful-fs')
var mkdirp = require('mkdirp')
var asyncMap = require('slide').asyncMap

module.exports = function (buildpath, pkg, log, next) {
  log.silly('finalize', pkg.path)

  var delpath = path.join(path.dirname(pkg.path), '.' + path.basename(pkg.path) + '.DELETE')

  mkdirp(path.resolve(pkg.path, '..'), whenParentExists)

  function whenParentExists (mkdirEr) {
    if (mkdirEr) return next(mkdirEr)
    fs.rename(buildpath, pkg.path, whenMoved)
  }

  function whenMoved (renameEr) {
    if (!renameEr) return next()
    if (renameEr.code !== 'ENOTEMPTY') return next(renameEr)
    fs.rename(pkg.path, delpath, whenOldMovedAway)
  }

  function whenOldMovedAway (renameEr) {
    if (renameEr) return next(renameEr)
    fs.rename(buildpath, pkg.path, whenConflictMoved)
  }

  function whenConflictMoved (renameEr) {
    // if we got an error we'll try to put back the original module back,
    // succeed or fail though we want the original error that caused this
    if (renameEr) return fs.rename(delpath, pkg.path, function () { next(renameEr) })
    fs.readdir(path.join(delpath, 'node_modules'), makeTarget)
  }

  function makeTarget (readdirEr, files) {
    if (readdirEr) return cleanup()
    if (!files.length) return cleanup()
    mkdirp(path.join(pkg.path, 'node_modules'), function (mkdirEr) { moveModules(mkdirEr, files) })
  }

  function moveModules (mkdirEr, files) {
    if (mkdirEr) return next(mkdirEr)
    asyncMap(files, function (file, done) {
      var from = path.join(delpath, 'node_modules', file)
      var to = path.join(pkg.path, 'node_modules', file)
      // we ignore errors here, because they can legitimately happen, for instance,
      // bundled modules will be in both node_modules folders
      fs.rename(from,to, function () { done() })
    }, cleanup)
  }

  function cleanup () {
    rimraf(delpath, afterCleanup)
  }

  function afterCleanup (rimrafEr) {
    if (rimrafEr) log.warn('finalize', rimrafEr)
    next()
  }
}
