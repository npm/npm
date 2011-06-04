
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

build._didBuild = {}
build._noLC = {}
function build (args, global, didPre, didRB, cb) {
  if (typeof cb !== "function") cb = didRB, didRB = false
  if (typeof cb !== "function") cb = didPre, didPre = false
  if (typeof cb !== "function") {
    cb = global, global = npm.config.get("global")
  }
  // it'd be nice to asyncMap these, but actually, doing them
  // in parallel generally munges up the output from node-waf
  var builder = build_(global, didPre, didRB)
  chain(args.map(function (arg) { return function (cb) {
    builder(arg, cb)
  }}).concat(cb))
}

function build_ (global, didPre, didRB) { return function (folder, cb) {
  folder = path.resolve(folder)
  build._didBuild[folder] = true
  log.info(folder, "build")
  readJson(path.resolve(folder, "package.json"), function (er, pkg) {
    if (er) return cb(er)
    chain
      ( !didPre && [lifecycle, pkg, "preinstall", folder]
      , [linkStuff, pkg, folder, global, didRB]
      , didPre !== build._noLC && [lifecycle, pkg, "install", folder]
      , didPre !== build._noLC && [lifecycle, pkg, "postinstall", folder]
      , didPre !== build._noLC
        && npm.config.get("npat")
        && [lifecycle, pkg, "test", folder]
      , cb )
  })
}}

function linkStuff (pkg, folder, global, didRB, cb) {
  // if it's global, and folder is in {prefix}/node_modules,
  // then bins are in {prefix}/bin
  // otherwise, then bins are in folder/../.bin
  var parent = path.dirname(folder)
    , gnm = global && path.resolve(npm.config.get("prefix")
                                  , "lib", "node_modules")
    , top = parent === npm.dir
    , gtop = parent === gnm

  log.verbose([global, gnm, gtop, parent], "linkStuff")
  log(pkg._id, "linkStuff")

  if (top && pkg.preferGlobal && !global) {
    log.warn(pkg._id + " should be installed with -g", "prefer global")
  }

  asyncMap( [linkBins, linkMans, !didRB && rebuildBundles]
          , function (fn, cb) {
    if (!fn) return cb()
    log.verbose(pkg._id, fn.name)
    fn(pkg, folder, parent, gtop, cb)
  }, cb)
}

function rebuildBundles (pkg, folder, parent, gtop, cb) {
  if (!npm.config.get("rebuild-bundle")) return cb()

  var deps = Object.keys(pkg.dependencies || {})
             .concat(Object.keys(pkg.devDependencies || {}))
    , bundles = pkg.bundleDependencies || pkg.bundledDependencies || []

  fs.readdir(path.resolve(folder, "node_modules"), function (er, files) {
    // error means no bundles
    if (er) return cb()

    log.verbose(files, "rebuildBundles")
    // don't asyncMap these, because otherwise build script output
    // gets interleaved and is impossible to read
    chain(files.filter(function (file) {
      // rebuild if:
      // not a .folder, like .bin or .hooks
      return file.charAt(0) !== "."
          // not some old 0.x style bundle
          && file.indexOf("@") === -1
          // either not a dep, or explicitly bundled
          && (deps.indexOf(file) === -1 || bundles.indexOf(file) !== -1)
    }).map(function (file) {
      file = path.resolve(folder, "node_modules", file)
      return function (cb) {
        if (build._didBuild[file]) return cb()
        log.verbose(file, "rebuild bundle")
        // if file is not a package dir, then don't do it.
        fs.lstat(path.resolve(file, "package.json"), function (er, st) {
          if (er) return cb()
          build_(false)(file, cb)
        })
    }}).concat(cb))
  })
}

function linkBins (pkg, folder, parent, gtop, cb) {
  if (!pkg.bin || !gtop && path.basename(parent) !== "node_modules") {
    return cb()
  }
  var binRoot = gtop ? path.resolve(npm.config.get("prefix"), "bin")
                     : path.resolve(parent, ".bin")
  log.verbose([pkg.bin, binRoot, gtop], "bins linking")
  asyncMap(Object.keys(pkg.bin), function (b, cb) {
    linkIfExists( path.resolve(folder, pkg.bin[b])
                , path.resolve(binRoot, b)
                , gtop && folder
                , function (er) {
      if (er) return cb(er)
      // bins should always be executable.
      fs.chmod(path.resolve(folder, pkg.bin[b]), 0755, function (er) {
        if (er || !gtop) return cb(er)
        var dest = path.resolve(binRoot, b)
          , src = path.resolve(folder, pkg.bin[b])
          , out = npm.config.get("parseable")
                ? dest + "::" + src + ":BINFILE"
                : dest + " -> " + src
        output.write(out, cb)
      })
    })
  }, cb)
}

function linkMans (pkg, folder, parent, gtop, cb) {
  if (!pkg.man || !gtop) return cb()
  var manRoot = path.resolve(npm.config.get("prefix"), "share", "man")
  asyncMap(pkg.man, function (man, cb) {
    if (typeof man !== "string") return cb()
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
    linkIfExists(manSrc, manDest, gtop && folder, cb)
  }, cb)
}
