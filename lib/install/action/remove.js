'use strict'
var path = require('path')
var fs = require('graceful-fs')
var asyncMap = require('slide').asyncMap
var mkdirp = require('mkdirp')
var npm = require('../../npm.js')
var gentlyRm = require('../../utils/gently-rm.js')
var andIgnoreErrors = require('../and-ignore-errors.js')
var move = require('../../utils/move.js')
var isInside = require('path-is-inside')
var vacuum = require('fs-vacuum')

// This is weird because we want to remove the module but not it's node_modules folder
// allowing for this allows us to not worry about the order of operations
module.exports = function (staging, pkg, log, next) {
  log.silly('remove', pkg.path)

  if (pkg.target) {
    removeLink(pkg, next)
  } else {
    let top = pkg
    while (top.parent && !top.isTop) top = pkg.parent
    removeDir(top.path, pkg, log, next)
  }
}

function removeLink (pkg, next) {
  var base = isInside(pkg.path, npm.prefix) ? npm.prefix : pkg.path
  gentlyRm(pkg.path, (err) => {
    if (err) return next(err)
    vacuum(pkg.path, {base: base}, next)
  })
}

function removeDir (top, pkg, log, next) {
  var modpath = path.join(path.dirname(pkg.path), '.' + path.basename(pkg.path) + '.MODULES')

  move(path.join(pkg.path, 'node_modules'), modpath).then(unbuildPackage, unbuildPackage)

  function unbuildPackage (moveEr) {
    gentlyRm(pkg.path, moveEr ? next : moveModulesBack)
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
      move(from, to).then(andIgnoreErrors(done), andIgnoreErrors(done))
    }, cleanup)
  }

  function cleanup () {
    gentlyRm(modpath, false, top, next)
  }
}
