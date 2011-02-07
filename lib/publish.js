
module.exports = publish

var npm = require("../npm")
  , rpub = require("./utils/registry/publish")
  , log = require("./utils/log")

publish.usage = "npm publish <tarball>"
              + "\nnpm publish <folder>"
              + "\n\nPublishes '.' if no argument supplied"

function publish (args, isRetry, cb) {
  if (typeof cb !== "function") cb = isRetry, isRetry = false
  if (args.length === 0) args = ["."]
  log.verbose(args, "publish")
  npm.commands.cache.add(args[0], args[1], true, function (er, data) {
    if (er) return cb(er)
    log.silly(data, "publish")
    if (!data) return cb(new Error("no package.json file found"))
    delete data.modules
    if (data.private) return cb(new Error
      ("This package has been marked as private\n"
      +"Remove the 'private' field from the package.json to publish it."))
    rpub(data, function (er) {
      if (er && er.errno === npm.EPUBLISHCONFLICT
          && npm.config.get("force") && !isRetry) {
        log.warn("Forced publish over "+data._id, "publish")
        return npm.commands.unpublish([data._id], function (er) {
          // ignore errors.  Use the force.  Reach out with your feelings.
          publish(args, true, cb)
        })
      }
      cb(er)
    })
  })
}
