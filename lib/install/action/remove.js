"use strict"
var rimraf = require("rimraf")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("remove", pkg.path)
  rimraf(pkg.path, finishLogAfterCb(log, cb))
}

