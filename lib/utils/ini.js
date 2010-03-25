
// TODO: Use ini parsing instead of JSON.  More humane.

// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

var fs = require('fs'),
    path = require('path'),
    http = require('http');

var defaultConfig  =
  { 'auto-activate' : true
  , root : path.join(process.env.HOME, '.node_libraries')
  , registry : "http://registry.npmjs.org/"
  };

function getConfig () {
  var configfile = path.join(process.env.HOME, '.npmrc')
  try {
    var config = JSON.parse(fs.readFileSync(configfile, "utf8"));
    for (var c in defaultConfig) {
      if (!config.hasOwnProperty(c)) {
        config[c] = defaultConfig[c];
      }
    }
  } catch (ex) {
    var config = defaultConfig;
  }
  exports.save = function (cb) {
    // write it back with some padding, so it's a bit more readable.
    fs.writeFile(configfile, JSON.stringify(config, null, 2), "utf8", cb);
  }
  exports.get = function (key) { return config[key] }
  exports.set = function(key, value) { return config[key] = value }
  return config;
}

// Protect against having two config objects inside the same node process.
Object.defineProperty(exports, "config", {value:getConfig(), enumerable:true});
