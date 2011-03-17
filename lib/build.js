
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


function build (args, cb) { asyncMap(args, build_, cb) }

function build_ (folder, cb) {
  folder = path.resolve(folder)
  log(folder, "build")
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
    , gnm = npm.config.get("global")
          && path.resolve(npm.prefix, "node_modules")
    , top = gnm === parent

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
    // error means no bundles
    if (er) return cb()

    asyncMap(files.filter(function (file) {
      return file.charAt(0) !== "."
          && file.indexOf("@") === -1
          && (deps.indexOf(file) === -1 || bundles.indexOf(file) !== -1)
    }).map(function (file) {
      return path.resolve(folder, "node_modules", file)
    }), function (file, cb) {
      // if not a dir, then don't do it.
      fs.lstat(file, function (er, st) {
        if (er || !st.isDirectory()) return cb()
        build_(file, cb)
      })
    }, cb)
  })
}

function linkBins (pkg, folder, parent, top, cb) {
  if (!pkg.bin) return cb()
  log(pkg.bin, "bins linking")
  var binRoot = top ? path.resolve(npm.config.get("prefix"), "bin")
                    : path.resolve(parent, ".bin")
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
