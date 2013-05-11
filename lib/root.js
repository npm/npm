module.exports = root

var npm = require("./npm.js")
  , log = require("npmlog")

root.usage = "npm root\nnpm root -g\n(just prints the root folder)"

function root (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false
  if (!silent) log.write(npm.dir + "\n")
  process.nextTick(cb.bind(this, null, npm.dir))
}
