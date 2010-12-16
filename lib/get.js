
module.exports = get

get.usage = "npm get <key> <value> (See `npm config`)"

var npm = require("../npm")

get.completion = function (args, index, cb) {
  npm.commands.config.completion(["get"].concat(args), index + 1, cb)
}

function get (args, cb) {
  npm.commands.config(["get"].concat(args), cb)
}
