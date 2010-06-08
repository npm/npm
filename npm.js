
var npm = exports
  , set = require("./lib/utils/set")
  , get = require("./lib/utils/get")
  , ini = require("./lib/utils/ini")
  , log = require("./lib/utils/log")
  , fs = require("fs")
  , path = require("path")

npm.commands = {}

try {
  var j = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))+"")
  npm.version = j.version
} catch (ex) {
  log(ex, "error reading version")
  npm.version = ex
}


; [ "install"
  , "activate"
  , "deactivate"
  , "uninstall"
  , "ls"
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
  ].forEach(function (c) { npm.commands[c] = require("./lib/"+c) })

npm.commands.list = npm.commands.ls
npm.commands.rm = npm.commands.uninstall

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
  { get: function () { return npm.config.get("root") }
  , set: function (newRoot) { npm.config.set("root", newRoot) }
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

process.addListener("exit", function () { ini.save() })
