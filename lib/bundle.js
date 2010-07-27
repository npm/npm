
module.exports = bundle

var npm = require("../npm")
  , fs = require("fs")
  , path = require("path")
  , log = require("./utils/log")
function bundle (args, cb) {
  log(args, "bundle")
  var location = args.pop()
    , usage = "Usage: npm bundle [<pkg> [<pkg> ...]] <location>"
  if (!location) return cb(new Error(usage))
  if (location.charAt(0) !== "/") {
    location = path.join(process.cwd(), location)
  }
  fs.stat(location, function (er, s) {
    if (er || !s.isDirectory()) return cb(new Error(usage))
    npm.config.set("root", location)
    npm.config.set("binroot", null)
    npm.commands.install(args, cb)
  })
}
