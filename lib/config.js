
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
  , fs = require("./utils/graceful-fs")
  , dc
  , output = require("./utils/output")
  , parseArgs = require("./utils/parse-args")

config.completion = function (opts, cb) {
  var argv = opts.conf.argv.remain
  if (argv[1] !== "config") argv.unshift("config")
  if (argv.length === 2) {
    var cmds = ["get", "set", "delete", "ls", "rm", "edit"]
    if (opts.partialWord !== "l") cmds.push("list")
    return cb(null, cmds)
  }
  console.error("config compl", opts)
  var action = argv[2]
  switch (action) {
    case "set":
      // todo: complete with valid values, if possible.
      if (argv.length > 3) return cb(null, [])
      // fallthrough
    case "get":
    case "delete":
    case "rm":
      return cb(null, Object.keys(parseArgs.types))
    case "edit":
    case "list": case "ls":
      return cb(null, [])
    default: return cb(null, [])
  }
}

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
      dc = dc || require("./utils/default-config")
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
                return "; " + k + " = " + ini.unParseField(dc[k],k)
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

function del (key, cb) {
  if (!key) return cb(new Error("no key provided"))
  ini.del(key)
  ini.save(cb)
}

function set (key, val, cb) {
  if (val === undefined) {
    if (key.indexOf("=") !== -1) {
      var k = key.split("=")
      key = k.shift()
      val = k.join("=")
    } else {
      val = ""
    }
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
  if (key.charAt(0) === "_") {
    return cb(new Error("---sekretz---"))
  }
  output.write(npm.config.get(key), cb)
}

function list (cb) {
  var msg = ""
  ini.keys.sort(function (a,b) { return a > b ? 1 : -1 })
    .forEach(function (i) {
      if (parseArgs.types[i] !== parseArgs.types[i]) {
        return
      }
      var val = (i.charAt(0) === "_")
          ? "---sekretz---"
          : JSON.stringify(ini.get(i))
      msg += i.replace(/^_/,';_')+" = "+val+"\n"
    })
  output.write(msg, cb)
}

function unknown (action, cb) {
  cb("Usage:\n" + config.usage)
}
