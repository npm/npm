
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
  , output = require("./utils/output")

module.exports = build
build.usage = "npm build <folder>\n(this is plumbing)"

function build (args, global, cb) {
  if (typeof cb !== "function") cb = global, global = npm.config.get("global")
  asyncMap(args, build_(global), cb)
}

function build_ (global) { return function (folder, cb) {
  folder = path.resolve(folder)
  log(folder, "build")
  readJson(path.resolve(folder, "package.json"), function (er, pkg) {
    if (er) return cb(er)
    chain
      ( [lifecycle, pkg, "preinstall", folder]
      , [linkStuff, pkg, folder, global]
      , [lifecycle, pkg, "install", folder]
      , [lifecycle, pkg, "postinstall", folder]
      , npm.config.get("npat") && [lifecycle, pkg, "test", folder]
        || function (cb) { cb() }
      , cb )
  })
}}

function linkStuff (pkg, folder, global, cb) {
  // if it's global, and folder is in {prefix}/node_modules,
  // then bins are in {prefix}/bin
  // otherwise, then bins are in folder/../.bin
  var parent = path.dirname(folder)
    , gnm = global && path.resolve(npm.config.get("prefix"), "node_modules")
    , top = gnm === parent

  log.verbose([global, gnm, top, parent], "linkStuff")
  log(pkg._id, "linkStuff")
  asyncMap([linkBins, linkMans, rebuildBundles], function (fn, cb) {
    log(pkg._id, fn.name)
    fn(pkg, folder, parent, top, cb)
  }, cb)
}

function rebuildBundles (pkg, folder, parent, top, cb) {
  if (!npm.config.get("rebuild-bundle")) return cb()

  var deps = Object.keys(pkg.dependencies || {})
             .concat(Object.keys(pkg.devDependencies || {}))
    , bundles = pkg.bundleDependencies || pkg.bundledDependencies || []

  fs.readdir(path.resolve(folder, "node_modules"), function (er, files) {
    log.verbose([er, files], "rebuildBundles")
    // error means no bundles
    if (er) return cb()

    asyncMap(files.filter(function (file) {
      return file.charAt(0) !== "."
          && file.indexOf("@") === -1
          && (deps.indexOf(file) === -1 || bundles.indexOf(file) !== -1)
    }).map(function (file) {
      return path.resolve(folder, "node_modules", file)
    }), function (file, cb) {
      log.verbose(file, "rebuild bundle")
      // if not a dir, then don't do it.
      fs.lstat(file, function (er, st) {
        if (er || !st.isDirectory()) return cb()
        build_(false)(file, cb)
      })
    }, cb)
  })
}

function linkBins (pkg, folder, parent, top, cb) {
  if (!pkg.bin) return cb()
  var binRoot = top ? path.resolve(npm.config.get("prefix"), "bin")
                    : path.resolve(parent, ".bin")
  log([pkg.bin, binRoot], "bins linking")
  asyncMap(Object.keys(pkg.bin), function (b, cb) {
    linkIfExists(path.resolve(folder, pkg.bin[b])
                ,path.resolve(binRoot, b)
                ,top && folder
                ,function (er) {
      if (er || !top) return cb(er)
      output.write(path.resolve(binRoot, b)+" -> "
                  +path.resolve(folder, pkg.bin[b]), cb)
    })
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
    linkIfExists(manSrc, manDest, top && folder, cb)
  }, cb)
}
