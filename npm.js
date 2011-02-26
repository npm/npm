
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
  , abbrev = require("./lib/utils/abbrev")
  , which = require("./lib/utils/which")
  , semver = require("semver")

npm.commands = {}
npm.ELIFECYCLE = {}
npm.E404 = {}
npm.EPUBLISHCONFLICT = {}
npm.EJSONPARSE = {}


try {
  // startup, ok to do this synchronously
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  npm.version = j.version
  npm.nodeVersionRequired = j.engines.node
} catch (ex) {
  try {
    log(ex, "error reading version")
  } catch (er) {}
  npm.version = ex
}

var commandCache = {}
  // short names for common things
  , aliases = { "rm" : "uninstall"
              , "r" : "uninstall"
              , "un" : "uninstall"
              , "rb" : "rebuild"
              , "bn" : "bundle"
              , "list" : "ls"
              , "search" : "ls"
              , "find" : "ls"
              , "ln" : "link"
              , "i" : "install"
              , "up" : "update"
              , "c" : "config"
              , "info" : "view"
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
              , "rebuild"
              , "bundle"
              , "outdated"
              , "init"
              , "deprecate"
              , "version"
              , "edit"
              , "explore"
              , "docs"
              , "faq"
              , "run-script"
              , "set"
              , "get"
              , "xmas"
              ]
  , plumbing = [ "build"
               , "update-dependents"
               , "completion"
               ]
  , fullList = npm.fullList = cmdList.concat(aliasNames).filter(function (c) {
      return plumbing.indexOf(c) === -1
    })
  , abbrevs = abbrev(fullList)

Object.keys(abbrevs).concat(plumbing).forEach(function (c) {
  Object.defineProperty(npm.commands, c, { get : function () {
    if (!loaded) throw new Error(
      "Call npm.load(conf, cb) before using this command.\n"+
      "See the README.md or cli.js for example usage.")
    var a = npm.deref(c)
    if (commandCache[a]) return commandCache[a]
    return commandCache[a] = require(__dirname+"/lib/"+a)
  }, enumerable: fullList.indexOf(c) !== -1 })
})
npm.deref = function (c) {
  if (plumbing.indexOf(c) !== -1) return c
  var a = abbrevs[c]
  if (aliases[a]) a = aliases[a]
  return a
}
var loaded = false
  , loading = false
  , loadListeners = []
npm.load = function (conf, cb_) {
  if (!cb_ && typeof conf === "function") cb_ = conf , conf = {}
  loadListeners.push(cb_)
  if (loaded) return cb()
  if (loading) return
  loading = true
  var onload = true
  function cb (er) {
    loaded = true
    loadListeners.forEach(function (cb) {
      process.nextTick(function () { cb(er, npm) })
    })
    loadListeners.length = 0
    if (onload = onload && npm.config.get("onload-script")) {
      require(onload)
      onload = false
    }
  }
  log.waitForConfig()
  which(process.argv[0], function (er, node) {
    if (!er && node !== process.execPath) {
      log.verbose("node symlink", node)
      process.execPath = node
    }
    ini.resolveConfigs(conf, cb)
  })
}

// Local store for package data, so it won't have to be fetched/read more than
// once in a single pass.
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
  { get : function () { return path.join(npm.root, npm.config.get('dotnpm')) }
  , enumerable : true
  })
Object.defineProperty(npm, "cache",
  { get : function () { return path.join(npm.root, npm.config.get('dotnpm'), ".cache") }
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

// platforms without uid/gid support are assumed to be in unsafe-perm mode.
var sudoOk = !semver.lt(process.version, '0.3.5')
if (!process.getuid || !sudoOk) {
  npm.config.set("unsafe-perm", true)
}
if (process.getuid && process.getuid() === 0 && !sudoOk) {
  process.nextTick(function () {
    log([""
        ,"Please upgrade to node 0.3.5 or higher"
        ,"if you are going to be running npm as root."
        ,"It is not safe otherwise."
        ,""].join("\n"), "", "error")
  })
}
