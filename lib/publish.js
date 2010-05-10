
// get a url to a tarball, fetch it, read the package.json, and
// publish to the registry.

module.exports = publish

var fs = require("fs")
  , path = require("path")
  , chain = require("./utils/chain")
  , rm = require("./utils/rm-rf")
  , readJson = require("./utils/read-json")
  , exec = require("./utils/exec")
  , mkdir = require("./utils/mkdir-p")
  , log = require("./utils/log")
  , semver = require("./utils/semver")
  , fetch = require("./utils/fetch")
  , registry = require("./utils/registry")
  , npm = require("../npm")
  , url = require("url")

function publish (args, cb) {
  log(args, "publish")
  npm.commands.cache.add(args[0], args[1], function (er, data) {
    if (er) return cb(er)
    log(data, "publish")
    if (!data) return cb(new Error("no data!?"))
    registry.publish(data, cb)
  })
}
