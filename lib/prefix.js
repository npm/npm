module.exports = prefix

var npm = require("../npm")
  , output = require("./utils/output")

prefix.usage = "npm prefix\nnpm prefix -g\n(just prints the prefix folder)"

function prefix (args, cb) { output.write(npm.prefix, cb) }
