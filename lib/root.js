module.exports = root

var npm = require("../npm")
  , output = require("./utils/output")

function root (args, cb) { output.write(npm.dir, cb) }
