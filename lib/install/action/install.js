"use strict"
var lifecycle = require("../../utils/lifecycle.js")

module.exports = function (buildpath, pkg, log, next) {
  log.silly("install", pkg.package.name, buildpath)
  lifecycle(pkg.package, "install", pkg.realpath, false, false, next)
}
