module.exports = prefix

var npm = require("../npm")
  , output = require("./utils/output")

function prefix (args, cb) {
  output.write(npm.config.get("outfd"), npm.prefix, cb)
}
