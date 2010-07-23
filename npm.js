// kludge until this is normal.
if (!process.EventEmitter.prototype.on) {
  process.EventEmitter.prototype.on = process.EventEmitter.prototype.addListener
}
var path = require("path")
if (!process.execPath) {
  process.execPath = path.join(process.installPrefix, "bin", "node")
}

var npm = exports
  , set = require("./lib/utils/set")
  , get = require("./lib/utils/get")
  , ini = require("./lib/utils/ini")
  , log = require("./lib/utils/log")
  , fs = require("fs")

npm.commands = {}
npm.SHOULD_EXIT = true

try {
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  npm.version = j.version
} catch (ex) {
  log(ex, "error reading version")
  npm.version = ex
}

var commandCache = {}
; [ "install"
  , "activate"
  , "deactivate"
  , "uninstall"
  , "build"
  , "link"
  , "publish"
  , "tag"
  , "adduser"
  , "config"
  , "help"
  , "cache"
  , "test"
  , "stop"
  , "start"
  , "restart"
  , "unpublish"
  , "list"
  , "ls"
  , "rm"
  ].forEach(function (c) {
    Object.defineProperty(npm.commands, c, { get : function () {
      c = c === "list" ? "ls"
        : c === "rm" ? "uninstall"
        : c
      if (c in commandCache) return commandCache[c]
      return commandCache[c] = require("./lib/"+c)
    }})
  })

// Local store for package data, so it won't have to be fetched/read more than
// once in a single pass.  TODO: cache this to disk somewhere when we're using
// the registry, to cut down on HTTP calls.
var registry = {}
npm.set = function (key, val) {
  if (typeof key === "object" && !val && key._id) {
    val = key
    key = key._id
  }
  return set(registry, key, val)
}
npm.get = function (key) { return get(registry, key) }

var path = require("path")
  , config = Object.create(ini.config)
npm.config =
  { get : function (key) {
      return ini.get(key, config)
    }
  , set : function (key, val) {
      if (typeof key === "object" && !val && key._id) {
        val = key
        key = key._id
      }
      return ini.set(key, val, config)
    }
  , del : function (key, val) {
      return ini.del(key, val, config)
    }
  }

// shorthand a few of these, because they're common
Object.defineProperty(npm, "root",
  { get: function () {
      var root = npm.config.get("root")
      return root.charAt(0) === "/" ? root
           : path.join(process.execPath, "..", "..", root)
    }
  , set: function (newRoot) {
      TEMPFOLDER = npm.temp
      npm.config.set("root", newRoot)
    }
  })
Object.defineProperty(npm, "dir",
  { get: function () { return path.join(npm.root, ".npm") }
  , enumerable:true
  })
Object.defineProperty(npm, "cache",
  { get: function () { return path.join(npm.root, ".npm", ".cache") }
  , enumerable:true
  })
Object.defineProperty(npm, "tmp",
  { get: function () { return path.join(npm.root, ".npm", ".tmp") }
  , enumerable:true
  })

var TEMPFOLDER = npm.tmp
process.on("exit", function () {
  ini.save()
  try {
    var files = fs.readdirSync(TEMPFOLDER)
  } catch (er) {
    return log(er, "Couldn't clean up tmp folder")
  }
  files.forEach(function (f) {
    try { fs.unlinkSync(TEMPFOLDER + "/" +f) }
    catch (er) { log(er, "Couldn't remove "+TEMPFOLDER+"/"+f) }
  })
})
