
var mkdir = require("./utils/mkdir-p")
  , npm = require("../npm")
  , fs = require("fs")
  , log = require("./utils/log")
  , path = require("path")
  , rm = require("./utils/rm-rf")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")
  , asyncMap = require("./utils/async-map")

module.exports = deactivate

function deactivate (args, cb) {
  asyncMap(args.map(function (a) {
    return a.split("@").shift()
  }), preDeactivate, function (er, data) {
    if (er) return cb(er)
    asyncMap(data, deactivate_, 4, function (er) {
      if (er) return cb(er)
      asyncMap(data, postDeactivate, cb)
    })
  })
}

function deactivate_ (data, cb) {
  var pkg = data.name
    , active = path.join(npm.dir, pkg, "active")
    , activeMain = path.join(npm.root, pkg+".js")
    , activeLib = path.join(npm.root, pkg)
    
  rm(active, cb)
  rm(activeMain, cb)
  rm(activeLib, cb)
  var binroot = npm.config.get("binroot")
  if (!data.bin || !binroot) return cb()
  asyncMap(Object.getOwnPropertyNames(data.bin)
            .map(function (bin) { return path.join(binroot, bin) })
          , rm
          , cb
          )
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
      data._id = data.name+"-"+data.version
      npm.set(data)
      chain
        ( [lifecycle, data, "predeactivate"]
        , [lifecycle, data, "deactivate"]
        , function (er) { cb(er, data) }
        )
    })
  })
}

function postDeactivate (data, cb) {
  asyncMap(data, function (d, cb) { lifecycle(d, "postdeactivate", cb) }, cb)
}
