"use strict"
var lifecycle = require("../../utils/lifecycle.js")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("install", pkg.package.name, buildpath)
  lifecycle(pkg.package, "install", pkg.realpath, false, false, finishLogAfterCb(log, cb))
}

