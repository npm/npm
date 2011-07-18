module.exports = root

var npm = require("../npm")
  , output = require("./utils/output")
  , log = require("./utils/log")

root.usage = "npm root\nnpm root -g\n(just prints the root folder)"

function root (args, cb) {
  output.write(npm.dir, cb)
}
