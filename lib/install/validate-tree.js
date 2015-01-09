"use strict"
var npm = require("../npm.js")
var andFinishTracker = require("./and-finish-tracker.js")
var flattenTree = require("./flatten-tree.js")
var npmInstallChecks = require("npm-install-checks")
var checkEngine = npmInstallChecks.checkEngine
var checkPlatform = npmInstallChecks.checkPlatform
var checkGit = npmInstallChecks.checkGit
var asyncMap = require("slide").asyncMap
var chain = require("slide").chain

module.exports = function (idealTree, log, next) {
  var moduleMap = flattenTree(idealTree)
  var force = npm.config.get("force")
  var nodeVersion = npm.config.get("node-version")
  var strict = npm.config.get("engine-strict")

  var modules = Object.keys(moduleMap).map(function (name) { return moduleMap[name] })

  asyncMap(modules, function (mod, done) {
    chain(
      [ [checkEngine, mod, npm.version, nodeVersion, force, strict]
      , [checkPlatform, mod, force]
      , mod.parent && [checkGit, mod.realpath]
      ], done)
  }, andFinishTracker(log, next))
}
