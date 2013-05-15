module.exports = prefix

var npm = require("./npm.js")
  , log = require("npmlog")

prefix.usage = "npm prefix\nnpm prefix -g\n(just prints the prefix folder)"

function prefix (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false
  if (!silent) log.write(npm.prefix + "\n")
  process.nextTick(cb.bind(this, null, npm.prefix))
}
