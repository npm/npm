
module.exports = rebuild

var readInstalled = require("./utils/read-installed")
  , asyncMap = require("./utils/async-map")
  , semver = require("semver")
  , log = require("./utils/log")
  , path = require("path")
  , npm = require("../npm")

rebuild.usage = "npm rebuild [<name>[@<version>] [name[@<version>] ...]]"

rebuild.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, true, cb)
}

function rebuild (args, cb) {
  readInstalled(npm.prefix, function (er, data) {
    if (er) return cb(er)
    var set = filter(data, args)
      , folders = Object.keys(set)
    if (!folders.length) return cb()
    asyncMap(folders, npm.commands.build, function (er) {
      if (er) return cb(er)
      folders.forEach(function (f) {
        console.log(set[f] + " " + f)
      })
      cb()
    })
  })
}

function filter (data, args, set) {
  if (!set) set = {}
  if (set.hasOwnProperty(data.path)) return set
  var pass
  if (!args.length) pass = true // rebuild everything
  else if (data.name) {
    for (var i = 0, l = args.length; i < l; i ++) {
      var arg = args[i]
        , nv = arg.split("@")
        , n = nv.shift()
        , v = nv.join("@")
      if (n !== data.name) continue
      if (!semver.satisfies(data.version, v)) continue
      pass = true
      break
    }
  }
  if (pass) {
    set[data.path] = data._id
  }
  // need to also dive through kids, always.
  // since this isn't an install these won't get auto-built unless
  // they're not dependencies.
  Object.keys(data.dependencies || {}).forEach(function (d) {
    var dep = data.dependencies[d]
    if (typeof dep === "string") return
    filter(dep, args, set)
  })
  return set
}
