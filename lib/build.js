
// npm build command

// everything about the installation after the creation of
// the .npm/{name}/{version}/package folder.
// linking the modules into the npm.root,
// resolving dependencies, etc.

// This runs AFTER install or link are completed.

var npm = require("../npm")
  , log = require("./utils/log")
  , chain = require("./utils/chain")
  , fs = require("./utils/graceful-fs")
  , path = require("path")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")
  , link = require("./utils/link")
  , linkIfExists = link.ifExists
  , asyncMap = require("./utils/async-map")

module.exports = build
build.usage = "npm build <folder>\n(this is plumbing)"


function build (args, cb) { asyncMap(args, build_, cb) }

function build_ (folder, cb) {
  folder = path.resolve(folder)
  readJson(path.resolve(folder, "package.json"), function (er, pkg) {
    if (er) return cb(er)
    chain
      ( [lifecycle, pkg, "preinstall", folder]
      , [linkStuff, pkg, folder]
      , [lifecycle, pkg, "install", folder]
      , cb )
  })
}

function linkStuff (pkg, folder, cb) {
  // if it's global, and folder is in {prefix}/node_modules,
  // then bins are in {prefix}/bin
  // otherwise, then bins are in folder/../.bin
  var parent = path.dirname(folder)
    , global = npm.config.get("global")
    , prefix = global && npm.config.get("prefix")
    , nm = global && path.resolve(prefix, "node_modules")
    , top = global && nm === parent

  asyncMap([linkBins, linkMans], function (fn, cb) {
    fn(pkg, folder, parent, top, cb)
  }, cb)
}

function linkBins (pkg, folder, parent, top, cb) {
  if (!pkg.bin) return cb()
  log(pkg.bin, "bins linking")
  var binRoot = top ? path.resolve(npm.config.get("prefix"), "bin")
                    : path.resolve(parent, ".bin")
  asyncMap(Object.keys(pkg.bin), function (b, cb) {
    linkIfExists(path.resolve(folder, pkg.bin[b])
                ,path.resolve(binRoot, b)
                ,cb)
  }, cb)
}

function linkMans (pkg, folder, parent, top, cb) {
  if (!pkg.man || !top) return cb()
  var manRoot = path.resolve(npm.config.get("prefix"), "share", "man")
  asyncMap(pkg.man, function (man, cb) {
    var parseMan = man.match(/(.*)\.([0-9]+)(\.gz)?$/)
      , stem = parseMan[1]
      , sxn = parseMan[2]
      , gz = parseMan[3] || ""
      , bn = path.basename(stem)
      , manSrc = path.join( folder, man )
      , manDest = path.join( manRoot
                           , "man"+sxn
                           , (bn.indexOf(pkg.name) === 0 ? bn
                             : pkg.name + "-" + bn)
                             + "." + sxn + gz
                           )
    linkIfExists(manSrc, manDest, cb)
  }, cb)
}
