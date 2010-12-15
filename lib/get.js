
module.exports = get

get.usage = "npm get <key> <value> (See `npm config`)"

function get (args, cb) {
  args.unshift("get")
  npm.commands.config(args, cb)
}
