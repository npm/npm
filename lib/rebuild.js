
module.exports = rebuild

var readInstalled = require("./utils/read-installed")
  , asyncMap = require("./utils/async-map")
  , semver = require("./utils/semver")
  , log = require("./utils/log")
  , path = require("path")
  , npm = require("../npm")
  , loadPackageDefaults = require("./utils/load-package-defaults")
  , lifecycle = require("./utils/lifecycle")
  , chain = require("./utils/chain")
  , readJson = require("./utils/read-json")

rebuild.usage = "npm rebuild [<name>[@<version>] [name[@<version>] ...]]"

function rebuild (args, cb) {
  log.verbose(args, "rebuild")
  lookupArgs(args, function (er, args) {
    if (er) return cb(er)
    if (!args.length) return log("Nothing to do", "rebuild", cb)
    asyncMap(args, function (arg, cb) {
      log.verbose(arg, "rebuild")
      arg = arg.split("@")
      var n = arg.shift()
        , v = arg.join("@")
      readJson(path.join(npm.dir, n, v, "package", "package.json"), function (er, data) {
        if (er) return cb(er)
        data.version = v
        data._id = data.name + "@" + data.version
        loadPackageDefaults(data, cb)
      })
    }, function (er, args) {
      if (er) return cb(er)
      npm.config.set("update-dependents", false)
      npm.config.set("auto-activate", false)
      npm.commands.build(args, cb)
    })
  })
}
// TODO: abstract this out for uninstall, etc to use.
function lookupArgs (args, cb) {
  if (!args.length) return readInstalled([], function (er, inst) {
    if (er) return cb(er)
    var a = []
    asyncMap(Object.keys(inst), function (p, cb) {
      cb(null, Object.keys(inst[p]).map(function (v) {
        return p+"@"+v
      }))
    }, cb)
  })
  var req = {}
  args.forEach(function (a) {
    a = a.split("@")
    var n = a.shift()
      , v = a.join("@")
    ;(req[n] = req[n] || []).push(v)
  })
  readInstalled(Object.keys(req), function (er, inst) {
    asyncMap(Object.keys(inst), function (p, cb) {
      if (!req.hasOwnProperty(p)) return cb()
      var matches = []
      Object.keys(inst[p]).forEach(function (v) {
        req[p].forEach(function (r) {
          if (semver.satisfies(v, r)) matches.push(p+"@"+v), v = null
        })
      })
      log.verbose(p, "rebuild")
      cb(null, matches)
    }, cb)
  })
}
