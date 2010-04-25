
var mkdir = require("./utils/mkdir-p")
  , npm = require("../npm")
  , fs = require("fs")
  , log = require("./utils/log")
  , path = require("path")
  , rm = require("./utils/rm-rf")
  , chain = require("./utils/chain")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")

module.exports = deactivate;

function deactivate (args, conf, cb) {
  // run the "deactivate" lifecycle event
  // unlink the "active" folder
  // unlink the libs and main.js from the npm.root
  // run the "postdeactivate" lifecycle event
  var pkg = args.shift()
    , active = path.join(npm.dir, pkg, "active")
    , jsonFile = path.join(active, "/package/package.json")
    , activeMain = path.join(npm.root, pkg+".js")
    , activeLib = path.join(npm.root, pkg)
    , pkgData = null

  readJson(jsonFile, function (er, data) {
    if (er) return cb(er)
    npm.set(data._id, data)
    chain
      ( [lifecycle, data, "predeactivate"]
      , [lifecycle, data, "deactivate"]
      , [rm, active]
      , function (cb) { rm(activeMain, function () { cb() }) }
      , function (cb) { rm(activeLib, function () { cb() }) }
      , function (cb) {
          if (!data.bin) return cb();
          chain(Object.getOwnPropertyNames(data.bin)
            .map(function (bin) {
              return [rm, path.join(process.installPrefix, "bin", bin)];
            }).concat(cb));
        }
      , [lifecycle, data, "postdeactivate"]
      , cb
      )
  })
}
