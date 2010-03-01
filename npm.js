
// always return the same npm object.  This is important, as
// programs might want to set the paths or other things.
var moduleName = __filename.replace(/\.js$/, '');
if (module.id !== moduleName) {
  module.exports = require(moduleName);
  return;
}

var utils = require("./lib/utils");

exports.moduleName = moduleName;

exports.install = require("./lib/install");
exports.activate = require("./lib/activate");
exports.ls = exports.list = require("./lib/ls");

var registry = {};

exports.set = set;
exports.get = get;

function set (name, data) { return utils.set(registry, name, data) };
function get (name) { return utils.get(registry, name) };

var path = require("path");

exports.root = path.join(process.env.HOME, ".node_libraries");
exports.__defineGetter__("dir", function () { return path.join(exports.root, ".npm") });
exports.__defineGetter__("tmp", function () { return path.join(exports.dir, ".tmp") });

