
module.exports = config;

var ini = require("./utils/ini")
  , log = require("./utils/log")
  , sys = require("sys")

// npm config set key value
// npm config get key
// npm config list
function config (args, conf, cb) {
  var action = args.shift()
  switch (action) {
    case "set": return set(args[0], args[1], cb)
    case "get": return get(args[0], cb)
    case "delete": case "rm": case "del": return del(args[0], cb)
    case "list": case "ls": return list(cb)
    default: return unknown(action, cb)
  }
}

function del (key, cb) {
  if (!key) return cb(new Error(
    "no key provided"))
  ini.del(key)
  ini.save(cb)
}

function set (key, val, cb) {
  if (val === undefined && key.indexOf("=") !== -1) {
    var k = key.split("=")
    key = k.shift()
    val = k.join("=")
  }
  key = key.trim()
  val = val.trim()
  log("set "+key+" "+val, "config")
  if (val === "true") val = true
  if (val === "false") val = false

  ini.set(key, val);
  ini.save(cb)
}

// don't use log() for this, since we may want to use it in shell scripts or whatever.
function get (key, cb) {
  sys.puts(ini.get(key))
  cb()
}

function list (cb) {
  for (var i in ini.config) {
    log(i+" "+JSON.stringify(ini.config[i]), "config")
  }
  cb()
}

function unknown (action, cb) {
  cb(new Error("Unrecognized config command "+action))
}
