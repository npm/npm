
module.exports = unpublish

var registry = require("./utils/registry")
  , log = require("./utils/log")

function unpublish (args, cb) {
  log(args, "unpublish")
  registry.unpublish(args[0], args[1], cb)
}
