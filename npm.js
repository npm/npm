
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
  , abbrev = require("abbrev")
  , which = require("./lib/utils/which")
  , semver = require("semver")
  , findPrefix = require("./lib/utils/find-prefix")
  , getUid = require("./lib/utils/uid-number")

npm.commands = {}
npm.ELIFECYCLE = {}
npm.E404 = {}
npm.EPUBLISHCONFLICT = {}
npm.EJSONPARSE = {}
npm.EISGIT = {}
npm.ECYCLE = {}
npm.EENGINE = {}


try {
  // startup, ok to do this synchronously
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  npm.version = j.version
  npm.nodeVersionRequired = j.engines.node
  if (!semver.satisfies(process.version, j.engines.node)) {
    log.error([""
              ,"npm requires node version: "+j.engines.node
              ,"And you have: "+process.version
              ,"which is not satisfactory."
              ,""
              ,"Bad things will likely happen.  You have been warned."
              ,""].join("\n"), "unsupported version")
  }
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
              , "unlink" : "uninstall"
              , "remove" : "uninstall"
              , "rb" : "rebuild"
              , "list" : "ls"
              , "la" : "ls"
              , "ll" : "ls"
              , "ln" : "link"
              , "i" : "install"
              , "up" : "update"
              , "c" : "config"
              , "info" : "view"
              , "find" : "search"
              , "s" : "search"
              , "se" : "search"
              , "author" : "owner"
              , "home" : "docs"
              }

  , aliasNames = Object.keys(aliases)
  // these are filenames in ./lib
  , cmdList = [ "install"
              , "uninstall"
              , "cache"
              , "config"
              , "set"
              , "get"
              , "update"
              , "outdated"
              , "prune"
              , "submodule"
              , "pack"

              , "rebuild"
              , "link"

              , "publish"
              , "tag"
              , "adduser"
              , "unpublish"
              , "owner"
              , "deprecate"

              , "help"
              , "help-search"
              , "ls"
              , "search"
              , "view"
              , "init"
              , "version"
              , "edit"
              , "explore"
              , "docs"
              , "faq"
              , "root"
              , "prefix"
              , "bin"
              , "whoami"

              , "test"
              , "stop"
              , "start"
              , "restart"
              , "run-script"
              , "completion"
              ]
  , plumbing = [ "build"
               , "unbuild"
               , "xmas"
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
    if (c === "la" || c === "ll") {
      npm.config.set("long", true)
    }
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
  if (!cb_) cb_ = function () {}
  if (!conf) conf = {}
  loadListeners.push(cb_)
  if (loaded) return cb()
  if (loading) return
  loading = true
  var onload = true

  function handleError (er) {
    loadListeners.forEach(function (cb) {
      process.nextTick(function () { cb(er, npm) })
    })
  }

  function cb (er) {
    if (er) return handleError(er)
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
      process.installPrefix = path.resolve(node, "..", "..")
    }
    ini.resolveConfigs(conf, function (er) {
      if (er) return handleError(er)
      var p
      if (!npm.config.get("global")
          && !conf.hasOwnProperty("prefix")) {
        p = process.cwd()
      } else {
        p = npm.config.get("prefix")
      }

      // if we're not in unsafe-perm mode, then figure out who
      // to run stuff as.  Do this first, to support `npm update npm -g`
      if (!npm.config.get("unsafe-perm")) {
        getUid( npm.config.get("user"), npm.config.get("group")
              , function (er, uid, gid) {
          if (er) return log.er(cb, "Could not get uid/gid")(er)
          next()
        })
      } else next()

      function next () {
        // try to guess at a good node_modules location.
        findPrefix(p, function (er, p) {
          if (er) return handleError(er)
          Object.defineProperty(npm, "prefix",
            { get : function () { return p }
            , set : function (r) { return p = r }
            , enumerable : true
            })
          return cb()
        })
      }

    })
  })
}

var path = require("path")
npm.config =
  { get : function (key) { return ini.get(key) }
  , set : function (key, val) { return ini.set(key, val, "cli") }
  , del : function (key, val) { return ini.del(key, val, "cli") }
  }

Object.defineProperty(npm, "dir",
  { get : function () {
      if (npm.config.get("global")) {
        return path.resolve(npm.prefix, "lib", "node_modules")
      } else {
        return path.resolve(npm.prefix, "node_modules")
      }
    }
  , enumerable : true
  })

Object.defineProperty(npm, "root",
  { get : function () { return npm.dir } })

Object.defineProperty(npm, "cache",
  { get : function () { return npm.config.get("cache") }
  , set : function (r) { return npm.config.set("cache", r) }
  , enumerable : true
  })

var tmpFolder
Object.defineProperty(npm, "tmp",
  { get : function () {
      if (!tmpFolder) tmpFolder = "npm-"+Date.now()
      return path.resolve(npm.config.get("tmp"), tmpFolder)
    }
  , enumerable : true
  })
