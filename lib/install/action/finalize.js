"use strict"
var path = require("path")
var rimraf = require("rimraf")
var fs = require("graceful-fs")
var mkdir = require("mkdirp")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("finalize", pkg.path)
  cb = finishLogAfterCb(log,cb)

  var delpath = pkg.realpath + ".DELETE"
 
  // Make sure the parent path exists before we start
  mkdir(path.resolve(pkg.realpath,".."), whenParentExists)
  // Then rename the staging folder to the destination
  function whenParentExists (er) {
    if (er) return cb(er)
    fs.rename(buildpath, pkg.realpath, whenMoved)
  }
  // If that failed 'cause there was a folder there, rename
  // the folder out of the way by tagging .DELETE on to its name
  function whenMoved (er) {
    if (!er || er.code != "ENOTEMPTY") return cb(er)
    fs.rename(pkg.realpath, delpath, whenOldMovedAway)
  }
  // Then try renaming the staging folder to the destination again
  function whenOldMovedAway(er) {
    if (er) return cb(er)
    fs.rename(buildpath, pkg.realpath, whenConflictMoved)
  }
  // If that fails, put the older folder back and give up, otherwise
  // remove the old folder
  function whenConflictMoved(er) {
    if (er) return fs.rename(delpath, pkg.realpath, function (){ cb(er) })
    rimraf(delpath, function (er) {
      if (er) log.warn("finalize", er)
      cb()
    })
  }
}
