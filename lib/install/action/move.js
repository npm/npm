'use strict'
var fs = require('graceful-fs')
var path = require('path')
var chain = require('slide').chain
var iferr = require('iferr')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var rmStuff = require('../../unbuild.js').rmStuff
var lifecycle = require('../../utils/lifecycle.js')
var updatePackageJson = require('../update-package-json')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('move', pkg.fromPath, pkg.path)
  chain([
    [lifecycle, pkg.package, 'preuninstall', pkg.fromPath, false, true],
    [lifecycle, pkg.package, 'uninstall', pkg.fromPath, false, true],
    [rmStuff, pkg.package, pkg.fromPath],
    [lifecycle, pkg.package, 'postuninstall', pkg.fromPath, false, true],
    [moveModuleOnly, pkg.fromPath, pkg.path, log],
    [lifecycle, pkg.package, 'preinstall', pkg.path, false, true],
    [removeEmptyParents, path.resolve(pkg.fromPath, '..')],
    [updatePackageJson, pkg, pkg.path]
  ], next)
}

function removeEmptyParents (pkgdir, next) {
  fs.rmdir(pkgdir, function (er) {
    // FIXME: Make sure windows does what we want here
    if (er && er.code !== 'ENOENT') return next()
    removeEmptyParents(path.resolve(pkgdir, '..'), next)
  })
}

function moveModuleOnly (from, to, log, done) {
  var from_modules = path.join(from, 'node_modules')
  var temp_modules = from + '.node_modules'

  log.silly('move', 'remove existing destination', to)
  rimraf(to, iferr(done, makeDestination))

  function makeDestination () {
    log.silly('move', 'make sure destination parent exists', path.resolve(to, '..'))
    mkdirp(path.resolve(to, '..'), iferr(done, moveNodeModules))
  }

  function moveNodeModules () {
    log.silly('move', 'move source node_modules away', from_modules)
    fs.rename(from_modules, temp_modules, function (er) {
      doMove(er ? done : moveNodeModulesBack)
    })
  }

  function doMove (next) {
    log.silly('move', 'move module dir to final dest', from, to)
    fs.rename(from, to, iferr(done, next))
  }

  function moveNodeModulesBack () {
    mkdirp(from, iferr(done, function () {
      log.silly('move', 'put source node_modules back', from_modules)
      fs.rename(temp_modules, from_modules, done)
    }))
  }
}
