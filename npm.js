
// always return the same npm object.  This is important, as
// programs might want to set the paths or other things.
var moduleName = __filename.replace(/\.js$/, '');
if (module.id !== moduleName) {
  module.exports = require(moduleName);
  return;
}

var npm = exports;

var utils = require("./lib/utils");

npm.moduleName = moduleName;

["install", "activate", "deactivate", "ls"].forEach(function (c) {
  npm[c] = require("./lib/"+c);
});
npm.list = npm.ls;

var registry = {};

npm.set = set;
npm.get = get;

function set (name, data) { return utils.set(registry, name, data) };
function get (name) { return utils.get(registry, name) };

var path = require("path");

npm.root = path.join(process.env.HOME, ".node_libraries");
npm.__defineGetter__("dir", function () { return path.join(npm.root, ".npm") });
npm.__defineGetter__("tmp", function () { return path.join(npm.dir, ".tmp") });

