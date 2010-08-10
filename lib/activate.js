
// activate a version of a package
// this presumes that it's been installed
// no need to worry about dependencies, because they were
// installed into the child package anyhow.

var mkdir = require("./utils/mkdir-p")
  , npm = require("../npm")
  , fs = require("fs")
  , log = require("./utils/log")
  , path = require("path")
  , rm = require("./utils/rm-rf")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")
  , link = require("./utils/link")
  , linkIfExists = link.ifExists
  , shimIfExists = require("./utils/write-shim").ifExists
  , semver = require("./utils/semver")

module.exports = activate

function activate (args, cb) {
  // make sure package and version exists.
  // If there's already an active version, then deactivate it.
  // first, link .npm/{pkg}/{version} to .npm/{pkg}/{active}
  // then, link the things in the root without a version to the active one.
  
  // TODO: remove this when it's more commonplace.
  if (args.length === 2 && !semver.valid(args[0]) && semver.valid(args[1])) {
    log("http://github.com/isaacs/npm/issues/issue/91", "See:")
    return cb(new Error(
      "Usage: npm activate <pkg>@<version> [pkg@<version> ...]"))
  }
  
  chain(args.map(function (arg) {
    return [activate_, arg]
  }).concat(cb))
}

function activate_ (arg, cb) {
  var args = arg.split("@")
    , pkg = args.shift()
    , version = args.join("@")
    , from = path.join(npm.dir, pkg, version)
    , to = path.join(npm.dir, pkg, "active")
    , fromMain = path.join(npm.dir, pkg, "active/main.js")
    , toMain = path.join(npm.root, pkg+".js")
    , fromLib = path.join(npm.dir, pkg, "active/lib")
    , toLib = path.join(npm.root, pkg)
    , jsonFile = path.join(npm.dir, pkg, version, "/package/package.json")

  if (!version) cb(new Error("Please specify a version to activate: "+pkg))

  chain
    ( function (cb) { npm.commands.deactivate([pkg], function () { cb() }) }
    , function (cb) {
        fs.lstat(to, function (er, stat) {
          if (!er) return fs.readlink(to, function (er, active) {
            cb(new Error("Implicit deactivate failed.\n"+
              pkg+"@"+path.dirname(active)+" still active."))
          })
          else cb()
        })
      }
    , function (er) {
        if (er) cb(er)
        readJson(jsonFile, function (er, data) {
          if (er) cb(er)
          data.version = version
          npm.set(data)
          chain
            ( [lifecycle, data, "preactivate"]
            , [link, from, to]
            , function (cb) {
                fs.stat(toMain, function (er) {
                  if (!er) return cb()
                  shimIfExists(fromMain, toMain, cb)
                })
              }
            , function (cb) {
                fs.stat(toLib, function (er) {
                  if (!er) return cb()
                  linkIfExists(fromLib, toLib, cb)
                })
              }
            , [linkBins, data]
            , [lifecycle, data, "activate"]
            , [lifecycle, data, "postactivate"]
            , cb
            )
        })
      }
    )
}

function linkBins (pkg, cb) {
  var binroot = npm.config.get('binroot')
  if (!pkg.bin || !binroot) return cb()
  chain(Object.keys(pkg.bin).map(function (i) {
    var to = path.join(binroot, i)
      , from = to+"-"+pkg.version
    return function (cb) {
      fs.stat(to, function (er) {
        if (!er) cb()
        linkIfExists(from, to, cb)
      })
    }
  }).concat(cb))
}
