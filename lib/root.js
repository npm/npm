module.exports = root

var npm = require("../npm")
  , output = require("./utils/output")

function root (args, cb) {
  output.write(npm.config.get("outfd"), npm.dir, cb)
}
