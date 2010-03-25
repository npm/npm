
module.exports = config;

var ini = require("./utils/ini"),
  log = require("./utils/log"),
  sys = require("sys");

// npm config set key value
// npm config get key
// npm config list
function config () {
  var cb = Array.prototype.pop.call(arguments),
    args = Array.prototype.slice.call(arguments, 1, -1),
    action = arguments[0];
  switch (action) {
    case "set" : return set(args[0], args[1], cb);
    case "get" : return get(args[0], cb);
    case "list" : return list(cb);
    default : return unknown(action, cb);
  }
}

function set (key, val, cb) {
  log("set "+key+" = "+val, "config");
  ini.set(key, val);
  ini.save(cb);
}

// don't use log() for this, since we may want to use it in shell scripts or whatever.
function get (key, cb) {
  sys.puts(ini.get(key));
  cb();
}

function list (cb) {
  for (var i in ini.config) {
    log(i+" "+JSON.stringify(ini.config[i]), "config");
  }
  cb();
}

function unknown (action, cb) {
  cb(new Error("Unrecognized config command "+action));
}
