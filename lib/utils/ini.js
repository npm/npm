
// TODO: Use ini parsing instead of JSON.  More humane.

// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , log = require("./log")
  , ini = require("ini")

  , defaultConfig  =
    { 'auto-activate' : true
    , root : path.join(process.env.HOME, '.node_libraries')
    , registry : "https://registry.npmjs.org/"
    }
  , configfile = path.join(process.env.HOME, '.npmrc')
  , config = getConfig()

exports.config = config
exports.save = save
exports.del = del
exports.get = get
exports.set = set

function getConfig () {
  // TODO: --config <path> on the cli to set this.
  var config
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
  return config
}

function save (cb) {
  fs[
    cb ? "writeFile" : "writeFileSync"
  ](configfile, ini.stringify({"-":config}), "utf8", cb)
}
function del (key, c) { delete (c || config)[key] }
function get (key, c) { return (c || config)[key] }
function set (key, value, c) { return (c || config)[key] = value }
