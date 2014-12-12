"use strict"
var lifecycle = require("../../utils/lifecycle.js")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("test", pkg.package.name, buildpath)
  lifecycle(pkg.package, "test", buildpath, false, false, finishLogAfterCb(log, cb))
}

