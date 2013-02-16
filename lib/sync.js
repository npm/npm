/*
 * npm sync [insert]
 * 
 * See doc/sync.md for more description
 */

module.exports = sync

sync.usage = "npm sync"
  + "\nnpm sync --save-dev"
  + "\nnpm sync --save-bundle"
  + "\nnpm sync --save-optional"
  + "\nnpm sync <package-name> [... <package-name2>]"
  + "\nnpm sync <package-name>"

sync.completion = function (opts, cb) { }

var path = require("path")
  , fs = require("graceful-fs")
  , npm = require("./npm.js")
  , semver = require("semver")
  , slide = require("slide")
  , readJson = require("read-package-json")

var validKeys = {
  "save":          "dependencies",
  "dev":           "devDependencies",
  "save-dev":      "devDependencies",
  "save-optional": "optionalDependencies",
  "save-bundle":   "bundleDependencies"
}

function sync(args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false
  callback          = cb
  syncPackagesCount = args.length
  jsonFile          = path.resolve(npm.prefix, "package.json")
  readJson(jsonFile, function(error, config) {
    if (error) return cb(error, null)
    packageConfig = config
    if (0 == syncPackagesCount) //{
      allPackages = Object.keys(packageConfig.dependencies || {}).concat(
        Object.keys(packageConfig.optionalDependencies || {}),
        Object.keys(packageConfig.devDependencies || {})
      )
    getInstalledPackageList(args, updatePackageList)
  })
}

var updatePackageList = function(error, list) {
  var writePackageFile = function(error, results) {
    if (error) return cb(error)
    fs.writeFile(jsonFile, JSON.stringify(packageConfig, null, 2), function(error) {
      callback(error, null)
    })
  }
  if (error) throw Error(error)
  dependencyKey = getDependencyKey()
  setupDependencyList(dependencyKey, arguments)
  if (allPackages)
    allPackages.filter(function(i) {return !(list.indexOf(i) > -1);}).forEach(function(package) {
      list.push(package)
    })
  slide.asyncMap(list, updateDependencies, writePackageFile)
}
      
var setupDependencyList = function(key, args) {
  if (!packageConfig[key] || (0 == syncPackagesCount))
    packageConfig[key] = (key == "bundleDependencies") ? new Array() : {} 
}

var getDependencyKey = function() {
  for (var key in validKeys)
    if (npm.config.get(key)) return validKeys[key]
  return "dependencies"
}

var updateDependencies = function(package, callback) {
  readJson(path.resolve(npm.dir, package, "package.json"), function(error, json) {
  	if (error) {
      if ('ENOENT' == error.code) {
        delete (packageConfig['dependencies'] || {})[package]
        delete (packageConfig['devDependencies'] || {})[package]
        delete (packageConfig['optionalDependencies'] || {})[package]
      }
    } else if (dependencyKey == "bundleDependencies") {
      if (!packageConfig['dependencies'][package]) 
        packageConfig[dependencyKey].push(package)
    } else {
    	if (dependencyKey == 'dependencies' || !packageConfig['dependencies'][package])
          packageConfig[dependencyKey][package] = "~" + json.version
    }
    callback(null, true)
  })
}

var getInstalledPackageList = function(args, callback) {
  if (args.length > 0) return callback(null, args)
  fs.readdir(path.resolve(npm.dir), callback)
}