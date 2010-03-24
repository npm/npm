
var npm = exports,
  set = require("./lib/utils/set"),
  get = require("./lib/utils/get"),
  ini = require("./lib/utils/ini");

npm.config = ini.getConfig();

[ "install"
, "activate"
, "deactivate"
, "uninstall"
, "ls"
, "build"
, "link"
, "publish"
, "tag"
, "adduser"
].forEach(function (c) {
  npm[c] = require("./lib/"+c);
});
npm.list = npm.ls;
npm.rm = npm.uninstall;

var registry = {};

npm.set = function (name, data) { return set(registry, name, data) };
npm.get = function (name) { return get(registry, name) };

var path = require("path");

Object.defineProperty(npm, "root",
  { get: function () { return npm.config.root }
  , set: function (newRoot) { npm.config.set("root", newRoot) }
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
  npm.config.save();
});
