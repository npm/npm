/*
 * npm backfill [insert]
 * 
 * See doc/backfill.md for more description
 */

module.exports = backfill

backfill.usage = "npm backfill"
  + "\nnpm backfill --clean"
  + "\nnpm backfill <package-name> [... <package-name2>]"
  + "\nnpm backfill --clean <package-name>"
  + "\nIf --clean flag is supplied any existing [dev]Dependencies are clobbered"

backfill.completion = function (opts, cb) { }

var path = require("path")
  , fs = require("graceful-fs")
  , npm = require("./npm.js")
  , semver = require("semver")
  , slide = require("slide")
  , readJson = require("read-package-json")
  
function backfill(args, silent, cb) {
    
  if (typeof cb !== "function") cb = silent, silent = false
  jsonFile = path.resolve(npm.prefix, "package.json")
  readJson(jsonFile, function(error, config) {
    if (error) cb(error, null)
    packageConfig = config
    getPackageList(args, function(error, list) {
      if (npm.config.get("clean")) {
        packageConfig.dependencies = {}
        packageConfig.devDependencies = {}
      }
      slide.asyncMap(list, updateDependencies, function(error, results) {
        if (error) return cb(error)
        fs.writeFile(jsonFile, JSON.stringify(packageConfig, null, 2), function(error) {
          if (error) return cb(error, null)
          cb(null, null)
        })
      })
    }) 
  })
}

updateDependencies = function(package, callback) {
  readJson(path.resolve(npm.dir, package, "package.json"), function(error, json) {
    if (error) return callback(null, true)
    packageConfig.dependencies[package] = "~" + json.version
    callback(null, true)
  })
}

getPackageList = function(args, callback) {
  if (args.length > 0) return callback(null, args)
  fs.readdir(path.resolve(npm.dir), function(error, files) {
    callback(error, files)
  })
}