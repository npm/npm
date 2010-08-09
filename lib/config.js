
module.exports = config

var ini = require("./utils/ini")
  , log = require("./utils/log")
  , npm = require("../npm")

// npm config set key value
// npm config get key
// npm config list
function config (args, cb) {
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
  var where = ini.get("global") ? "global" : "user"
  ini.set(key, val, where)
  ini.save(cb)
}

function get (key, cb) {
  if (key.charAt(0) === "_") return cb(new Error("---sekretz---"))
  console.log(npm.config.get(key))
  cb()
}

function list (cb) {
  ini.keys.sort(function (a,b) { return a > b ? 1 : -1 })
    .forEach(function (i) {
      var val = (i.charAt(0) === "_")
          ? "---sekretz---"
          : JSON.stringify(ini.get(i))
      console.log(i.replace(/^_/,';_')+" = "+val)
    })
  cb()
}

function unknown (action, cb) {
  console.error("Usage:")
  console.error(" npm config [ ls | get <key> | set <key> <val> | delete <key> ]")
  cb()
}
