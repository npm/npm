
module.exports = publish

var npm = require("../npm")
  , rpub = require("./utils/registry/publish")
  , log = require("./utils/log")

publish.usage = "npm publish <tarball>"
              + "\nnpm publish <folder>"
              + "\n\nPublishes '.' if no argument supplied"

function publish (args, cb) {
  if (args.length === 0) args = ["."]
  log.verbose(args, "publish")
  npm.commands.cache.add(args[0], args[1], function (er, data) {
    if (er) return cb(er)
    log.silly(data, "publish")
    if (!data) return cb(new Error("no package.json file found"))
    rpub(data, cb)
  })
}
