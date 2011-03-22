module.exports = bin

var npm = require("../npm")
  , output = require("./utils/output")

function bin (args, cb) {
  var path = require("path")
    , global = npm.config.get("global")
    , b = global ? path.join(npm.prefix, "bin") : path.join(npm.dir, ".bin")
  output.write(b, cb)
}
