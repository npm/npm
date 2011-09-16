
module.exports = star

var npm = require("../npm")
  , registry = require("./utils/npm-registry-client")
  , log = require("./utils/log")
  , tar = require("./utils/tar")
  , sha = require("./utils/sha")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , fs = require("fs")
  , lifecycle = require("./utils/lifecycle")
  , chain = require("slide").chain

star.usage = "npm star <package> <yes/no>"

star.completion = function (opts, cb) {
  // for now, not yet implemented.
  return cb()
}

function star (args, cb) {
  if (args.length !== 2) return cb(new Error("you must specify exactly two parameters: package and yes or no"))
  var using
  if (args[1] === "yes")
    using = true
  else if (args[1] === "no")
    using = false
  else
    return cb(new Error("second parameter must be yes or no"))
  log.verbose(args, "star")
  registry.use(args[0], using, function (er) {
    cb(er)
  })
}
