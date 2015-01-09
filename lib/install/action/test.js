"use strict"
var lifecycle = require("../../utils/lifecycle.js")

module.exports = function (buildpath, pkg, log, next) {
  log.silly("test", pkg.package.name, buildpath)
  lifecycle(pkg.package, "test", buildpath, false, false, next)
}
