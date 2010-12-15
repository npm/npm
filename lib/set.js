
module.exports = set

set.usage = "npm set <key> <value> (See `npm config`)"

function set (args, cb) {
  args.unshift("set")
  npm.commands.config(args, cb)
}
