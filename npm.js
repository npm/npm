
process.title = "npm"

if (require.main === module) {
  console.error(["It looks like you're doing 'node npm.js'."
                ,"Don't do that.  Instead, run 'make install'"
                ,"and then use the 'npm' command line utility."
                ].join("\n"))
  process.exit(1)
}

var EventEmitter = require("events").EventEmitter
  , npm = module.exports = new EventEmitter
  , config = require("./lib/config")
  , set = require("./lib/utils/set")
  , get = require("./lib/utils/get")
  , ini = require("./lib/utils/ini")
  , log = require("./lib/utils/log")
  , fs = require("./lib/utils/graceful-fs")
  , path = require("path")
  , mkdir = require("./lib/utils/mkdir-p")
  , abbrev = require("./lib/utils/abbrev")

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
  // short names for common things
  , aliases = { "rm" : "uninstall"
              , "r" : "uninstall"
              , "rb" : "rebuild"
              , "bn" : "bundle"
              , "list" : "ls"
              , "ln" : "link"
              , "i" : "install"
              , "u" : "update"
              , "up" : "update"
              , "c" : "config"
              }
  , aliasNames = Object.keys(aliases)
  // these are filenames in ./lib
  , cmdList = [ "install"
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
              , "ls"
              , "owner"
              , "update"
              , "update-dependents"
              , "view"
              , "repl"
              , "rebuild"
              , "bundle"
              , "outdated"
              , "init"
              , "completion"
              , "deprecate"
              ]
  , fullList = npm.fullList = cmdList.concat(aliasNames)
  , abbrevs = abbrev(fullList)

Object.keys(abbrevs).forEach(function (c) {
  Object.defineProperty(npm.commands, c, { get : function () {
    var a = npm.deref(c)
    if (commandCache[a]) return commandCache[a]
    return commandCache[a] = require(__dirname+"/lib/"+a)
  }, enumerable: fullList.indexOf(c) !== -1 })
})
npm.deref = function (c) {
  var a = abbrevs[c]
  if (aliases[a]) a = aliases[a]
  return a
}
var loaded = false
npm.load = function (conf, cb_) {
  if (!cb_ && typeof conf === "function") cb_ = conf , conf = {}
  function cb (er) { return cb_(er, npm) }
  if (loaded) return cb()
  loaded = true
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
