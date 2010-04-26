
// TODO: Use ini parsing instead of JSON.  More humane.

// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , log = require("./log")
  , ini = require("ini")

var defaultConfig  =
  { 'auto-activate' : true
  , root : path.join(process.env.HOME, '.node_libraries')
  , registry : "https://registry.npmjs.org/"
  }

function getConfig () {
  // TODO: --config <path> on the cli to set this.
  var configfile = path.join(process.env.HOME, '.npmrc')
    , config
  log(configfile, "configfile")
  try {
    config = fs.readFileSync(configfile, "utf8")
    // TODO v0.0.8: remove this JSON parse next version
    try {
      config = JSON.parse(config)
    } catch (ex) {
      config = ini.parse(config)["-"]
    }
  } catch (ex) {
    config = defaultConfig
  }
  for (var c in defaultConfig) {
    if (!config.hasOwnProperty(c)) {
      config[c] = defaultConfig[c]
    }
  }

  exports.save = function (cb) {
    // write it back with some padding, so it's a bit more readable.
    fs[
      (cb ? "writeFile" : "writeFileSync")
    ](configfile, ini.stringify({"-":config}), "utf8", cb)
  }
  exports.del = function (key) { delete config[key] }
  exports.get = function (key) { return config[key] }
  exports.set = function (key, value) { return config[key] = value }
  return config
}

// Protect against having two config objects inside the same node process.
Object.defineProperty(exports, "config", {value:getConfig(), enumerable:true});
