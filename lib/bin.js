module.exports = bin

var npm = require("../npm")
  , output = require("./utils/output")

bin.usage = "npm bin\nnpm bin -g\n(just prints the bin folder)"

function bin (args, cb) {
  var path = require("path")
    , global = npm.config.get("global")
    , b = global ? path.join(npm.prefix, "bin") : path.join(npm.dir, ".bin")
    , PATH = (process.env.PATH || "").split(":")
  output.write(b, cb)
  if (npm.config.get("global") && PATH.indexOf(b) === -1) {
    output.write("(not in PATH env variable)"
                ,npm.config.get("logfd"))
  }
}
