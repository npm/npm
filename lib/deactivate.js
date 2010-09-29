
var mkdir = require("./utils/mkdir-p")
  , npm = require("../npm")
  , fs = require("./utils/graceful-fs")
  , log = require("./utils/log")
  , path = require("path")
  , rm = require("./utils/rm-rf")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")
  , asyncMap = require("./utils/async-map")
  , loadPackageDefaults = require("./utils/load-package-defaults")

module.exports = deactivate

deactivate.usage = "npm deactivate <pkg>"

function deactivate (args, cb) {
  var rb = npm.ROLLBACK
  npm.ROLLBACK = true
  asyncMap(args.map(function (a) {
    return a.split("@").shift()
  }), preDeactivate, function (er, data) {
    if (er) return cb(er)
    asyncMap
      ( data
      , function (d, cb) { rm(path.join(npm.dir, d.name, "active"), cb) }
      , function (d, cb) { rm(path.join(npm.root, d.name+".js"), cb) }
      , function (d, cb) { rm(path.join(npm.root, d.name), cb) }
      , rmBins
      , rmMans
      , function (er) {
          if (er) return cb(er)
          asyncMap(data, postDeactivate, function (er) {
            npm.ROLLBACK = rb
            cb(er)
          })
        }
      )
  })
}

function rmBins (data, cb) {
  var binroot = npm.config.get("binroot")
  if (!data.bin || !binroot) return cb()
  asyncMap(Object.getOwnPropertyNames(data.bin)
            .map(function (bin) { return path.join(binroot, bin) })
          , rm
          , cb
          )
}
function rmMans (pkg, cb) {
  var manroot = npm.config.get("manroot")
  if (!pkg.man || !manroot) return cb()
  asyncMap(pkg.man, function (man, cb) {
    var parseMan = man.match(/(.*)\.([0-9]+)(\.gz)?$/)
      , stem = parseMan[1]
      , sxn = parseMan[2]
      , gz = parseMan[3] || ""
      , bn = path.basename(stem)
    rm(path.join( manroot
                , "man"+sxn
                , (bn.indexOf(pkg.name) === 0 ? bn
                  : pkg.name + "-" + bn)
                  + "." + sxn + gz
                ), cb)
  }, cb)
}

function preDeactivate (pkg, cb) {
  // run the "deactivate" lifecycle event
  // unlink the "active" folder
  // unlink the libs and main.js from the npm.root
  // run the "postdeactivate" lifecycle event
  var active = path.join(npm.dir, pkg, "active")
    , jsonFile = path.join(active, "package", "package.json")

  fs.readlink(active, function (er, p) {
    if (er) return cb()
    var version = path.basename(p)
    readJson(jsonFile, function (er, data) {
      if (er) return cb(er)
      data.version = version
      data._id = data.name+"@"+data.version
      npm.set(data)
      loadPackageDefaults(data, function (er, data) {
        if (er) return cb(er)
        chain
          ( [lifecycle, data, "predeactivate"]
          , [lifecycle, data, "deactivate"]
          , function (er) { cb(er, data) }
          )
      })
    })
  })
}

function postDeactivate (data, cb) {
  asyncMap(data, function (d, cb) { lifecycle(d, "postdeactivate", cb) }, cb)
}
