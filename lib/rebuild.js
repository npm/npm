
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

rebuild.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, true, cb)
}

function rebuild (args, cb) {
  log.verbose(args, "rebuild")
  lookupArgs(args, function (er, args) {
    if (er) return cb(er)
    if (!args.length) return log("Nothing to do", "rebuild", cb)
    var folders = []
      , actives = []
    args = args.reduce(function (r, l) {
      Object.keys(l).forEach(function (p) {
        r[p] = r[p] || {}
        Object.keys(l[p]).forEach(function (v) {
          if (v === "active") {
            r[p].active = l[p].active
            actives.push([p, l[p].active])
          } else {
            r[p][v] = l[p][v]
            folders.push([p, v])
          }
        })
      })
      return r
    }, {})
    log.silly(folders,"rebuild folders")
    log.silly(actives, "rebuild actives")
    asyncMap(folders, function (arg, cb) {
      log.verbose(arg, "rebuild")
      var n = arg[0]
        , v = arg[1]
      readJson( path.join(npm.dir, n, v, "package", "package.json")
              , function (er, data) {
        if (er) return cb(er)
        data.version = v
        data._id = data.name + "@" + data.version
        loadPackageDefaults(data, cb)
      })
    }, function (er, args) {
      if (er) return cb(er)
      npm.commands.build(args, function (er) {
        // now activate what was activated before, in case building
        // activated a different thing (very likely)
        asyncMap(actives, function (active, cb) {
          npm.commands.activate([active.join("@")], cb)
        }, cb)
      })
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
        var o = {}
        o[p] = {}
        o[p][v] = inst[p][v]
        if (o[p][v].active) o[p].active = v
        return o
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
  log.silly(req, "rebuild request")
  readInstalled(Object.keys(req), function (er, inst) {
    asyncMap(Object.keys(inst), function (p, cb) {
      if (!req.hasOwnProperty(p)) return cb()
      var matches = []
      Object.keys(inst[p]).forEach(function (v) {
        req[p].forEach(function (r) {
          var o = {}
          o[p] = {}
          if (inst[p][v].active) o[p].active = v
          if (semver.satisfies(v, r)) o[p][v] = inst[p][v]
          matches.push(o)
        })
      })
      log.verbose(p, "rebuild")
      cb(null, matches)
    }, cb)
  })
}
