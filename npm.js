var utils = require("./lib/utils");

exports.install = require("./lib/install");
exports.activate = require("./lib/activate");

var registry = {};

exports.set = set;
exports.get = get;

function set (name, data) { return utils.set(registry, name, data) };
function get (name) { return utils.get(registry, name) };

var path = require("path");

exports.root = path.join(process.env.HOME, ".node_libraries");
exports.__defineGetter__("dir", function () { return path.join(exports.root, ".npm") });
exports.__defineGetter__("tmp", function () { return path.join(exports.dir, ".tmp") });

