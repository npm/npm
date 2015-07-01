'use strict'
var path = require('path')
var validate = require('aproba')
var npmInstallChecks = require('npm-install-checks')
var checkEngine = npmInstallChecks.checkEngine
var checkPlatform = npmInstallChecks.checkPlatform
var checkGit = npmInstallChecks.checkGit
var asyncMap = require('slide').asyncMap
var chain = require('slide').chain
var clone = require('lodash.clonedeep')
var normalizePackageData = require('normalize-package-data')
var npm = require('../npm.js')
var andFinishTracker = require('./and-finish-tracker.js')
var flattenTree = require('./flatten-tree.js')
var validateAllPeerDeps = require('./deps.js').validateAllPeerDeps
var getPackageId = require('./get-package-id.js')

module.exports = function (idealTree, log, next) {
  validate('OOF', arguments)
  var moduleMap = flattenTree(idealTree)
  var force = npm.config.get('force')
  var nodeVersion = npm.config.get('node-version')
  var strict = npm.config.get('engine-strict')

  var modules = Object.keys(moduleMap).map(function (name) { return moduleMap[name] })

  asyncMap(modules, function (mod, done) {
    chain([
      [checkEngine, mod, npm.version, nodeVersion, force, strict],
      [checkPlatform, mod, force],
      mod.parent && !isInLink(mod) && [checkGit, mod.realpath],
      [checkErrors, mod, idealTree]
      ], done)
  }, andValidateAllPeerDeps(idealTree, andCheckTop(idealTree, andFinishTracker(log, next))))
}

function isInLink (mod) {
  if (!mod.parent) return false
  if (mod.path !== mod.realpath) return true
  return isInLink(mod.parent)
}

function checkErrors (mod, idealTree, next) {
  if (mod.error && (mod.parent || path.resolve(npm.globalDir, '..') !== mod.path)) idealTree.warnings.push(mod.error)
  next()
}

function andValidateAllPeerDeps (idealTree, next) {
  validate('OF', arguments)
  return function (er) {
    validateAllPeerDeps(idealTree, function (tree, pkgname, version) {
      var warn = new Error(getPackageId(tree) + ' requires a peer of ' + pkgname + '@' +
        version + ' but none was installed.')
      warn.code = 'EPEERINVALID'
      idealTree.warnings.push(warn)
    })
    next(er)
  }
}

function andCheckTop (idealTree, next) {
  validate('OF', arguments)
  if (idealTree.package.error) {
    return next
  } else {
    return function (er) {
      // FIXME: when we replace read-package-json with something less magic,
      // this should done elsewhere.
      // As it is, the package has already been normalized and thus some
      // errors are suppressed.
      var pkg = clone(idealTree.package)
      normalizePackageData(pkg, function (warn) {
        var warnObj = new Error(getPackageId(idealTree) + ' ' + warn)
        warnObj.code = 'EPACKAGEJSON'
        idealTree.warnings.push(warnObj)
      }, false)
      next(er)
    }
  }
}
