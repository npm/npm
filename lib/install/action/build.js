"use strict"
var chain = require("slide").chain
var finishLogAfterCb = require("../finish-log-after-cb.js")
var build = require("../../build.js")
var npm = require("../../npm.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("build", pkg.package.name)
  chain(
    [ [build.linkStuff, pkg.package, buildpath, npm.config.get("global"), false]
    , [build.writeBuiltinConf, pkg, pkg.package.path]
    ]
  , finishLogAfterCb(log,cb))
}

