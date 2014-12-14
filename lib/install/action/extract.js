"use strict"
var path = require("path")
var sortedObject = require("sorted-object")
var writeFileAtomic = require("write-file-atomic")
var npm = require("../../npm.js")
var cache = require("../../cache.js")
var finishLogAfterCb = require("../finish-log-after-cb.js")

var deepSortObject = function (obj,sortBy) {
  if (obj == null || typeof obj != "object") return obj
  if (obj instanceof Array) {
    return obj.sort(sortBy)
  }
  obj = sortedObject(obj)
  Object.keys(obj).forEach(function(key) {
    obj[key] = deepSortObject(obj[key])
  })
  return obj
}

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("extract", pkg.path.name)
  cb = finishLogAfterCb(log,cb)
  var up = npm.config.get("unsafe-perm")
    , user = up ? null : npm.config.get("user")
    , group = up ? null : npm.config.get("group")
  cache.unpack(pkg.package.name, pkg.package.version
        , buildpath
        , null, null, user, group, function (er) {
    if (er) return cb(er)
    var packagejson = deepSortObject(pkg.package)
    var data = JSON.stringify(packagejson, null, 2) + "\n"
    writeFileAtomic(path.resolve(buildpath,"package.json"), data, cb)
  })
}
