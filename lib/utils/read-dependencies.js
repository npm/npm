
var path = require("path")
  , npm = require("../../npm")
  , readJson = require("./read-json")
  , readInstalled = require("./read-installed")
  , fs = require("./graceful-fs")
  , semver = require("./semver")
  , log = require("./log")

module.exports = readDependencies

// cb(er, Array:deps)

function readDependencies(json, cb) {
  cb = cb || function(){}
  
  if(typeof json === "string") {
    return readJson(json, function(er, data) {
      if(er) return cb(er)
      readDependencies_(data, cb)
    })
  }
  
  readDependencies_(json, cb)
}

function readDependencies_(data, cb) {
  npm.load(function(er, npm){
    if (er) return log.er(cb, "Couldn't load npm")(er)
    
    var deps = data.dependencies || {}

    if (npm.config.get("dev")) {
      devDeps = data["dev-dependencies"] || {};
      Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })

      devDeps = data.devDependencies || {};
      Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })
    }
    // now see if any of them are already bundled.
    // if so, omit them from the list.
    var bundle = path.join( npm.cache, deps.name, deps.version
                          , "package", "node_modules" )
    fs.readdir(bundle, function (er, bundles) {
      bundles = bundles || []
      bundles.forEach(function (b) { delete deps[b] })
      
      cb(null, deps)
    })
  });
}
