'use strict'
var validate = require('aproba')
var npmInstallChecks = require('npm-install-checks')
var checkEngine = npmInstallChecks.checkEngine
var checkPlatform = npmInstallChecks.checkPlatform
var checkGit = npmInstallChecks.checkGit
var asyncMap = require('slide').asyncMap
var chain = require('slide').chain
var npm = require('../npm.js')
var andFinishTracker = require('./and-finish-tracker.js')
var flattenTree = require('./flatten-tree.js')
var validatePeerDeps = require('./deps.js').validatePeerDeps

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
      mod.parent && !isInLink(mod) && [checkGit, mod.realpath]
      ], done)
  }, andValidatePeerDeps(idealTree, log, andFinishTracker(log, next)))
}

function isInLink (mod) {
  if (!mod.parent) return false
  if (mod.path !== mod.realpath) return true
  return isInLink(mod.parent)
}

function andValidatePeerDeps (idealTree, log, next) {
  validate('OOF', arguments)
  return function (er) {
    validatePeerDeps(idealTree, log)
    next(er)
  }
}
