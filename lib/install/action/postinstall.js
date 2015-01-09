"use strict"
var lifecycle = require("../../utils/lifecycle.js")

module.exports = function (buildpath, pkg, log, next) {
  log.silly("postinstall", pkg.package.name, buildpath)
  lifecycle(pkg.package, "postinstall", pkg.realpath, false, false, next)
}
