
// link the supplied folder to .npm/{name}/{version}/package

var npm = require("../npm")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , fs = require("fs")
  , readJson = require("./utils/read-json")
  , rm = require("./utils/rm-rf")
  , mkdir = require("./utils/mkdir-p")
  , path = require("path")

module.exports = link

function link (args, cb) {
  var folder = args.shift()
  // folder's root MUST contain a package.json
  // read that for package info, then link it in, clobbering if necessary.
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  var pkg = {}
    , jsonFile = path.join(folder, "package.json")
  log(folder, "link")
  chain
    ( function (cb) { fs.stat(folder, function (er, stats) {
        if (er) return cb(er)
        if (!stats.isDirectory()) {
          return cb(new Error("npm link requires a directory"))
        }
        log(folder+" is a directory", "link")
        cb()
      })}
    , [log, "reading "+jsonFile, "link"]
    , function (cb) { readJson(jsonFile, function (er, data) {
        if (er) return cb(er)
        log(data.name+" "+data.version, "link")
        pkg._data = data
        cb()
      })}
    , [link_, folder, pkg]
    , [npm.commands, "build", [pkg]]
    , cb
    )
}

function link_ (folder, pkg, cb) {
  pkg = pkg && pkg._data || pkg
  if (!pkg) cb(new Error(
    "Invalid package data"))
  var pkgRoot = path.join(npm.dir, pkg.name, pkg.version)
    , pkgDir = path.join(pkgRoot, "package")
  chain
    ( [rm, pkgDir]
    , [mkdir, pkgRoot]
    , [fs, "symlink", folder, pkgDir]
    , [log, "created symlink: "+pkgDir, "link"]
    , cb
    )
}
