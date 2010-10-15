
module.exports = config

config.usage = "npm config set <key> <value>"
             + "\nnpm config get <key>"
             + "\nnpm config delete <key>"
             + "\nnpm config list"
             + "\nnpm config edit"

var ini = require("./utils/ini")
  , log = require("./utils/log")
  , npm = require("../npm")
  , exec = require("./utils/exec")
  , fs = require("fs")
  , dc = require("./utils/default-config")

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
    case "edit": return edit(cb)
    default: return unknown(action, cb)
  }
}

function edit (cb) {
  var e = ini.get("editor")
    , f = ini.get(ini.get("global") ? "globalconfig" : "userconfig")
  if (!e) return cb(new Error("No EDITOR config or environ set."))
  ini.save(function (er) {
    if (er) return cb(er)
    fs.readFile(f, "utf8", function (er, data) {
      if (er) data = ""
      data = [ ";;;;"
             , "; npm "+(ini.get("global") ? "globalconfig" : "userconfig")+" file"
             , "; this is a simple ini-formatted file"
             , "; lines that start with semi-colons are comments, and removed."
             , "; read `npm help config` for help on the various options"
             , ";;;;"
             , ""
             , data
             ].concat( [ ";;;;"
                       , "; all options with default values"
                       , ";;;;"
                       ]
                     )
              .concat(Object.keys(dc).map(function (k) {
                return "; " + k + " = " + ini.unParseField(dc[k],k.match(/root$/i))
              }))
              .concat([""])
              .join("\n")
      fs.writeFile
        ( f
        , data
        , "utf8"
        , function (er) {
            if (er) return cb(er)
            exec("sh", ["-c", e + " "+f], function (er) {
              if (er) return cb(er)
              ini.resolveConfigs(function (er) {
                if (er) return cb(er)
                ini.save(cb)
              })
            })
          }
        )
    })
  })
}
function stringify (conf, k) {
  return 
}

function del (key, cb) {
  if (!key) return cb(new Error("no key provided"))
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
  if (!key) return list(cb)
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
  cb("Usage:\n" + config.usage)
}
