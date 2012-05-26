
// remove a package.

module.exports = uninstall

uninstall.usage = "npm uninstall <name>[@<version> [<name>[@<version>] ...]"
                + "\nnpm rm <name>[@<version> [<name>[@<version>] ...]"

uninstall.completion = require("./utils/completion/installed-shallow.js")

var fs = require("graceful-fs")
  , log = require("./utils/log.js")
  , readJson = require("./utils/read-json.js")
  , path = require("path")
  , npm = require("./npm.js")
  , semver = require("semver")
  , asyncMap = require("slide").asyncMap

function uninstall (args, cb) {
  // this is super easy
  // get the list of args that correspond to package names in either
  // the global npm.dir,
  // then call unbuild on all those folders to pull out their bins
  // and mans and whatnot, and then delete the folder.

  var nm = npm.dir
  if (args.length === 1 && args[0] === ".") args = []
  if (args.length) return uninstall_(args, nm, cb)

  // remove this package from the global space, if it's installed there
  if (npm.config.get("global")) return cb(uninstall.usage)
  readJson(path.resolve(npm.prefix, "package.json"), function (er, pkg) {
    if (er) return cb(uninstall.usage)
    uninstall_( [pkg.name]
              , npm.dir
              , cb )
  })

}

function uninstall_ (args, nm, cb) {
  var o = uninstallOutput(args, nm)
  asyncMap(args, function (arg, cb) {
    // uninstall .. should not delete /usr/local/lib/node_modules/..
    var p = path.join(path.resolve(nm), path.join("/", arg))
    if (path.resolve(p) === nm) {
      log.warn(arg, "uninstall: invalid argument")
      return cb(null, [])
    }
    fs.lstat(p, function (er) {
      if (er) {
        log.warn(arg, "Not installed in "+nm)
        return cb(null, [])
      }
      cb(null, p, o)
    })
  }, function (er, folders) {
    if (er) return cb(er)
    asyncMap(folders, npm.commands.unbuild, cb)
  })
}

function uninstallOutput (args, nm) {
  for (var i = 0; i < args.length; i++) {
    var p = path.join(path.resolve(nm), path.join("/", args[i]))
    log.warn(p, "uninstalling")
  }
}
