
process.title = "npm"

var npm = exports
  , config = require("./lib/config")
  , set = require("./lib/utils/set")
  , get = require("./lib/utils/get")
  , ini = require("./lib/utils/ini")
  , log = require("./lib/utils/log")
  , fs = require("./lib/utils/graceful-fs")
  , path = require("path")
  , mkdir = require("./lib/utils/mkdir-p")

npm.commands = {}
npm.ELIFECYCLE = {}
npm.E404 = {}

try {
  // startup, ok to do this synchronously
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  npm.version = j.version
  npm.nodeVersionRequired = j.engines.node
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
  , "owner"
  , "update"
  , "update-dependents"
  , "view"
  , "repl"
  , "rebuild"
  , "bundle"
  , "outdated"
  , "init"
  ].forEach(function (c) {
    Object.defineProperty(npm.commands, c, { get : function () {
      c = c === "list" ? "ls"
        : c === "rm" ? "uninstall"
        : c
      if (c in commandCache) return commandCache[c]
      return commandCache[c] = require(__dirname+"/lib/"+c)
    }, enumerable: true})
  })

var loaded = false
npm.load = function (conf, cb) {
  if (!cb && typeof conf === "function") cb = conf , conf = {}
  if (loaded) return cb()
  loaded = true
  // don't assume that npm is installed in any particular spot, since this
  // might conceivably be a bootstrap attempt.
  log.waitForConfig()
  ini.resolveConfigs(conf, function (er) {
    if (er) return cb(er)
    mkdir(npm.tmp, cb)
  })
}

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
npm.config =
  { get : function (key) { return ini.get(key) }
  , set : function (key, val) { return ini.set(key, val, "cli") }
  , del : function (key, val) { return ini.del(key, val, "cli") }
  }

Object.defineProperty(npm, "root",
  { get : function () { return npm.config.get("root") }
  , set : function (r) {
      r = r.charAt(0) === "/" ? r
        : path.join(process.execPath, "..", "..", r)
      return npm.config.set("root", r)
    }
  , enumerable : true
  })
Object.defineProperty(npm, "dir",
  { get : function () { return path.join(npm.root, ".npm") }
  , enumerable : true
  })
Object.defineProperty(npm, "cache",
  { get : function () { return path.join(npm.root, ".npm", ".cache") }
  , enumerable : true
  })
var tmpFolder
Object.defineProperty(npm, "tmp",
  { get : function () {
      if (!tmpFolder) tmpFolder = "npm-"+Date.now()
      return path.join(npm.config.get("tmproot"), tmpFolder)
    }
  , enumerable : true
  })

if (process.getuid() === 0) {
  log.error( "\nRunning npm as root is not recommended!\n"
           + "Seriously, don't do this!\n", "sudon't!")
}
