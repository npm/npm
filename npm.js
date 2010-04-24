
var npm = exports,
  set = require("./lib/utils/set"),
  get = require("./lib/utils/get"),
  ini = require("./lib/utils/ini"),
  log = require("./lib/utils/log");

npm.commands = {}

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
  ].forEach(function (c) {
    npm.commands[c] = require("./lib/"+c);
  })

npm.commands.list = npm.commands.ls;
npm.commands.rm = npm.commands.uninstall;

// Local store for package data, so it won't have to be fetched/read more than
// once in a single pass.  TODO: cache this to disk somewhere when we're using
// the registry, to cut down on HTTP calls.
var registry = {};
npm.set = function (name, data) { return set(registry, name, data) };
npm.get = function (name) { return get(registry, name) };

var path = require("path");

Object.defineProperty(npm, "root",
  { get: function () { return ini.config.root }
  , set: function (newRoot) { ini.set("root", newRoot) }
  });
Object.defineProperty(npm, "dir",
  { get: function () { return path.join(npm.root, ".npm") }
  , enumerable:true
  });
Object.defineProperty(npm, "tmp",
  { get: function () { return path.join(npm.root, ".npm", ".tmp") }
  , enumerable:true
  });

process.addListener("exit", function () {
  ini.save();
});
