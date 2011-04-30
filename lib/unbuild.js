module.exports = unbuild
unbuild.usage = "npm unbuild <folder>\n(this is plumbing)"

var readJson = require("./utils/read-json")
  , rm = require("./utils/rm-rf")
  , npm = require("../npm")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , lifecycle = require("./utils/lifecycle")
  , asyncMap = require("./utils/async-map")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , build = require("./build")

// args is a list of folders.
// remove any bins/etc, and then delete the folder.
function unbuild (args, cb) { asyncMap(args, unbuild_, cb) }

function unbuild_ (folder, cb) {
  folder = path.resolve(folder)
  delete build._didBuild[folder]
  log.info(folder, "unbuild")
  readJson(path.resolve(folder, "package.json"), function (er, pkg) {
    // if no json, then just trash it, but no scripts or whatever.
    if (er) return rm(folder, cb)
    chain
      ( [lifecycle, pkg, "preuninstall", folder]
      , [lifecycle, pkg, "uninstall", folder]
      , [rmStuff, pkg, folder]
      , [lifecycle, pkg, "postuninstall", folder]
      , [rm, folder]
      , cb )
  })
}

function rmStuff (pkg, folder, cb) {
  // if it's global, and folder is in {prefix}/node_modules,
  // then bins are in {prefix}/bin
  // otherwise, then bins are in folder/../.bin
  var parent = path.dirname(folder)
    , gnm = path.resolve(npm.config.get("prefix"), "lib", "node_modules")
    , top = gnm === parent

  log.verbose([top, gnm, parent], "unbuild "+pkg._id)
  asyncMap([rmBins, rmMans], function (fn, cb) {
    fn(pkg, folder, parent, top, cb)
  }, cb)
}

function rmBins (pkg, folder, parent, top, cb) {
  if (!pkg.bin) return cb()
  var binRoot = top ? path.resolve(npm.config.get("prefix"), "bin")
                    : path.resolve(parent, ".bin")
  log.verbose([binRoot, pkg.bin], "binRoot")
  asyncMap(Object.keys(pkg.bin), function (b, cb) {
    rm(path.resolve(binRoot, b), !npm.config.get("force") && folder, cb)
  }, cb)
}

function rmMans (pkg, folder, parent, top, cb) {
  if (!pkg.man || !top) return cb()
  var manRoot = path.resolve(npm.config.get("prefix"), "share", "man")
  asyncMap(pkg.man, function (man, cb) {
    var parseMan = man.match(/(.*)\.([0-9]+)(\.gz)?$/)
      , stem = parseMan[1]
      , sxn = parseMan[2]
      , gz = parseMan[3] || ""
      , bn = path.basename(stem)
      , manDest = path.join( manRoot
                           , "man"+sxn
                           , (bn.indexOf(pkg.name) === 0 ? bn
                             : pkg.name + "-" + bn)
                             + "." + sxn + gz
                           )
    rm(manDest, !npm.config.get("force") && folder, cb)
  }, cb)
}
