var utils = require("./lib/utils");

exports.install = require("./lib/install");

var registry = {};

exports.set = set;
exports.get = get;

function set (name, data) { return utils.set(registry, name, data) };
function get (name) { return utils.get(registry, name) };
