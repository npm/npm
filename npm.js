
var npm = exports,
  set = require("./lib/utils/set"),
  get = require("./lib/utils/get"),
  ini = require("./lib/utils/ini");

npm.config = ini.getConfig();

// TODO: read configs from a conf file or cli
// defaulting here is a wee bit hackish and potentially unsafe.
// better to require that it be set in the conf or cli, and
// fail if it's not set.

// TODO: point this at a public js-registry instance some time soon.
// This works right now by setting an /etc/hosts entry pointing
// the "packages" hostname to a running instance of the js-registry

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

npm.root = path.join(process.env.HOME, ".node_libraries");
Object.defineProperty(npm, "dir",
  { get: function () { return path.join(npm.root, ".npm") }
  , enumerable:true
  });
Object.defineProperty(npm, "tmp",
  { get: function () { return path.join(npm.dir, "tmp") }
  , enumerable:true
  });

