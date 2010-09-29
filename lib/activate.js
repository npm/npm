
// activate a version of a package
// this presumes that it's been installed
// no need to worry about dependencies, because they were
// installed into the child package anyhow.

var mkdir = require("./utils/mkdir-p")
  , npm = require("../npm")
  , fs = require("./utils/graceful-fs")
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
  , asyncMap = require("./utils/async-map")
  , loadPackageDefaults = require("./utils/load-package-defaults")

module.exports = activate

activate.usage =
  "npm activate <name>@<version> [<name>@<version> ...]"

function activate (args, cb) {
  // make sure package and version exists.
  // If there's already an active version, then deactivate it.
  // first, link .npm/{pkg}/{version} to .npm/{pkg}/{active}
  // then, link the things in the root without a version to the active one.
  if (!args.length) return cb(new Error(activate.usage))
  asyncMap(args, preActivate, function (er, data) {
    log.silly(args, "preActivate over")
    if (er) return cb(er)
    asyncMap
      ( data
      , function (d, cb) {
          var from = path.join(npm.dir, d.name, d.version)
            , to = path.join(npm.dir, d.name, "active")
          link(from, to, cb)
        }
      , function (d, cb) {
          var fromMain = path.join(npm.dir, d.name, "active", "main.js")
            , toMain = path.join(npm.root, d.name+".js")
          shimIfExists(fromMain, toMain, cb)
        }
      // todo: remove this step.  0.1.28
      // required because old deps will be linked with - rather than @
      , function (d, cb) {
          var fromLib = path.join(npm.root, d.name + "-" + d.version)
            , toLib = path.join(npm.root, d.name)
          linkIfExists(fromLib, toLib, cb)
        }
      // if both @ and - exist, then this will overwrite the kludge one.
      , function (d, cb) {
          var fromLib = path.join(npm.root, d.name + "@" + d.version)
            , toLib = path.join(npm.root, d.name)
          linkIfExists(fromLib, toLib, cb)
        }
      , linkBins
      , linkMans
      , function (er) {
          if (er) return cb(er)
          asyncMap(data, postActivate, cb)
        }
      )
  })
}

function postActivate (data, cb) {
  chain
    ( [lifecycle, data, "activate"]
    , [lifecycle, data, "postactivate"]
    , cb
    )
}

function preActivate (arg, cb) {
  var args = arg.split("@")
    , pkg = args.shift()
    , version = args.join("@")
    , to = path.join(npm.dir, pkg, "active")
    , jsonFile = path.join(npm.dir, pkg, version, "package", "package.json")

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
        if (er) return cb(er)
        readJson(jsonFile, function (er, data) {
          if (er) return cb(er)
          data.version = version
          data._id = data.name + "@" + data.version
          npm.set(data)
          loadPackageDefaults(data, function (er, data) {
            if (er) return cb(er)
            log.silly(data._id, "defaults loaded")
            lifecycle(data, "preactivate", function (er) { cb(er, data) })
          })
        })
      }
    )
}
function linkMans (pkg, cb) {
  log.verbose(pkg._id, "activate linkMans")
  log.silly(pkg.man, "activate linkMans")
  var manroot = npm.config.get("manroot")
  if (!pkg.man || !manroot) return cb()
  asyncMap(pkg.man, function (man, cb) {
    var parseMan = man.match(/(.*)\.([0-9]+)(\.gz)?$/)
      , stem = parseMan[1]
      , sxn = parseMan[2]
      , gz = parseMan[3] || ""
      , bn = path.basename(stem)
      , manStem = path.join( manroot
                           , "man"+sxn
                           , (bn.indexOf(pkg.name) === 0 ? bn
                             : pkg.name + "-" + bn)
                           )
      , suff = pkg.version + "." + sxn + gz
      , manDest = manStem + "." + sxn + gz
    log.silly(manDest, "manDest")
    linkIfExists(manStem+"-"+suff, manDest, function (er) {
      if (er) return cb(er)
      linkIfExists(manStem+"@"+suff, manDest, cb)
    })
  }, cb)
}
function linkBins (pkg, cb) {
  log.verbose(pkg._id, "activate linkBins")
  log.silly(pkg.bin, "activate linkBins")
  var binroot = npm.config.get("binroot")
  if (!pkg.bin || !binroot) return cb()
  asyncMap(Object.keys(pkg.bin), function (i, cb) {
    var to = path.join(binroot, i)
      , v = pkg.version
    linkIfExists(to+"-"+v, to, function (er) {
      if (er) return cb(er)
      linkIfExists(to+"@"+v, to, cb)
    })
  }, cb)
}
