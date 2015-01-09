"use strict"
var npm = require("../../npm.js")

module.exports = function (buildpath, pkg, log, next) {
  log.silly("remove", pkg.path)
  npm.commands.unbuild(pkg.path, next)
}
