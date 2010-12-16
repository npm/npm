
module.exports = set

set.usage = "npm set <key> <value> (See `npm config`)"

var npm = require("../npm")

set.completion = function (args, index, cb) {
  npm.commands.config.completion(["set"].concat(args), index + 1, cb)
}

function set (args, cb) {
  npm.commands.config(["set"].concat(args), cb)
}
