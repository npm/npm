module.exports = prefix

var npm = require("../npm")
  , output = require("./utils/output")

function prefix (args, cb) { output.write(npm.prefix, cb) }
