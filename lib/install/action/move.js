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
var log = require('npmlog')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('move', pkg.fromPath, pkg.path)
  chain([
    [lifecycle, pkg.package, 'preuninstall', pkg.fromPath, false, true],
    [lifecycle, pkg.package, 'uninstall', pkg.fromPath, false, true],
    [rmStuff, pkg.package, pkg.fromPath],
    [lifecycle, pkg.package, 'postuninstall', pkg.fromPath, false, true],
    [moveModuleOnly, pkg.fromPath, pkg.path],
    [lifecycle, pkg.package, 'preinstall', pkg.path, false, true],
    [removeEmptyParents, path.resolve(pkg.fromPath, '..')],
    [updatePackageJson, pkg, pkg.path]
  ], next)
}

function noerrors () {
  var args = Array.prototype.slice.call(arguments)
  var todo = args.shift()
  var cb = args.pop()
  todo.apply(null, function (er) {
    if (er) {
      log.warn('move', er)
    }
    cb.apply(null, args)
  })
}

module.exports.rollback = function (buildpath, pkg, next) {
  chain([
    [noerrors, mkdirp, path.resolve(pkg.fromPath, '..')],
    [noerrors, lifecycle, pkg.package, 'preuninstall', pkg.path, false, true],
    [noerrors, lifecycle, pkg.package, 'uninstall', pkg.path, false, true],
    [noerrors, rmStuff, pkg.package, pkg.path],
    [noerrors, lifecycle, pkg.package, 'postuninstall', pkg.path, false, true],
    [noerrors, moveModuleOnly, pkg.path, pkg.fromPath],
    [noerrors, lifecycle, pkg.package, 'preinstall', pkg.fromPath, false, true],
    [noerrors, removeEmptyParents, path.resolve(pkg.path, '..')],
    [noerrors, updatePackageJson, pkg, pkg.fromPath]
  ], next)
}

function removeEmptyParents (pkgdir, next) {
  fs.rmdir(pkgdir, function (er) {
    // FIXME: Make sure windows does what we want here
    if (er && er.code !== 'ENOENT') return next()
    removeEmptyParents(path.resolve(pkgdir, '..'), next)
  })
}

function moveModuleOnly (from, to, done) {
  var from_modules = path.join(from, 'node_modules')
  var temp_modules = from + '.node_modules'

  rimraf(to, iferr(done, makeDestination))

  function makeDestination () {
    mkdirp(path.resolve(to, '..'), iferr(done, moveNodeModules))
  }

  function moveNodeModules () {
    fs.rename(from_modules, temp_modules, function (er) {
      doMove(er ? done : moveNodeModulesBack)
    })
  }

  function doMove (next) {
    fs.rename(from, to, iferr(done, next))
  }

  function moveNodeModulesBack () {
    mkdirp(from, iferr(done, function () {
      fs.rename(temp_modules, from_modules, done)
    }))
  }
}
