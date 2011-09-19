
module.exports = star

var npm = require("../npm.js")
  , registry = require("./utils/npm-registry-client/index.js")
  , log = require("./utils/log.js")
  , asyncMap = require("slide").asyncMap
  , output = require("./utils/output.js")

star.usage = "npm star <package>\n"
           + "npm unstar <package>"

star.completion = function (opts, cb) {
  registry.get("/-/short", null, 60000, function (er, list) {
    return cb(null, list || [])
  })
}

function star (args, cb) {
  var S = npm.config.get("unicode") ? "\u2605 " : "*"
  var using = !(npm.command.match(/^un/))
  asyncMap(args, function (pkg, cb) {
    registry.star(pkg, using, function (er, data, raw, req) {
      output.write(S + " "+pkg, npm.config.get("outfd"))
      log.verbose(er || data, "back from star")
      cb(er, data, raw, req)
    })
  }, cb)
}
