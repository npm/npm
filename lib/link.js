
// link the supplied folder to .npm/{name}/{version}/package

var npm = require("../npm")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , fs = require("./utils/graceful-fs")
  , readJson = require("./utils/read-json")
  , rm = require("./utils/rm-rf")
  , mkdir = require("./utils/mkdir-p")
  , path = require("path")
  , crypto
  , readInstalled = require("./utils/read-installed")
  , semver = require("./utils/semver")
  , symlink = require("./utils/link")

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}

module.exports = link
link.usage = "npm link <folder>"
function link (args, cb) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the link feature"))
  var folder = args.shift() || "."
  // folder's root MUST contain a package.json
  // read that for package info, then link it in, clobbering if necessary.
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  var jsonFile = path.join(folder, "package.json")
  log(folder, "link")
  chain
    ( function (cb) { fs.stat(folder, function (er, stats) {
        if (er) return cb(er)
        if (!stats.isDirectory()) return cb(new Error(
          "npm link requires a directory"))
        cb()
      })}
    , [log.verbose, "reading "+jsonFile, "link"]
    , [readAndLink, jsonFile, folder]
    , cb
    )
}

function readAndLink (jsonFile, folder, cb) {
  readJson
    ( jsonFile
    , { "tag" : "-1-LINK-"+(
        crypto.createHash("sha1").update(folder).digest("hex").substr(0,8)
      )}
    , doLink(folder, cb)
    )
}
function getDeps (data) {
  var deps = data.dependencies || {}
    , devDeps = data.devDependencies || {}
  Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })
  return deps
}
function doLink (folder, cb) { return function (er, data) {
  if (er) return cb(er)
  log.verbose(data._id, "link")
  var pkgDir = path.join(npm.dir, data.name, data.version, "package")
    , deps = getDeps(data)
    , depNames = Object.keys(deps)

  // skip any that are installed
  readInstalled(depNames, function (er, inst) {
    if (er) return log.er(cb, "Couldn't read installed packages")(er)
    log.verbose(deps, "link deps")
    for (var d in inst) if (deps[d]) {
      log.verbose(d, "dep installed")
      var satis = semver.maxSatisfying(Object.keys(inst[d]), deps[d])
      if (satis) delete deps[d]
    }
    var depsNeeded = Object.keys(deps).map(function (d) {
      return d+"@"+deps[d]
    })
    log.verbose(depsNeeded, "link install deps")
    chain
      ( depsNeeded.length ? [ npm.commands, "install", depsNeeded.slice(0) ]
                          : function (cb) { return cb() }
      , [ symlink, folder, pkgDir ]
      , [ npm.commands, "build", [data] ]
      , function (er) {
          if (!er) return cb()
          // error, rollback
          npm.ROLLBACK = true
          log.error(er, "error linking, rollback")
          var rb = depsNeeded.concat([data.name+"@"+data.version])
          npm.commands.rm(rb, function (er_) {
            if (er_) log.error(er_, "error rolling back")
            cb(er)
          })
        }
      )
  })
}}
