"use strict"
var npm = require("../npm.js")
var finishLogAfterCb = require("./finish-log-after-cb.js")
var flattenTree = require("./flatten-tree.js")
var npmInstallChecks = require("npm-install-checks")
var checkEngine = npmInstallChecks.checkEngine
var checkPlatform = npmInstallChecks.checkPlatform
var checkCycle = npmInstallChecks.checkCycle
var checkGit = npmInstallChecks.checkGit
var asyncMap = require("slide").asyncMap
var chain = require("slide").chain

module.exports = function (idealTree, log, cb) {
  var modules = flattenTree(idealTree)
  var force = npm.config.get("force")
  var nodeVersion = npm.config.get("node-version")
  var strict = npm.config.get("engine-strict")

  asyncMap(Object.keys(modules).map(function(K){ return modules[K] }), function(mod,cb) {
    chain(
      [ [checkEngine, mod, npm.version, nodeVersion, force, strict] 
      , [checkPlatform, mod, force]
      , mod.parent && [checkGit, mod.realpath]
      ], cb)
  }, finishLogAfterCb(log, cb))
}
