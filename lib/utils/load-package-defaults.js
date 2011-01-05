
module.exports = loadPackageDefaults

var path = require("path")
  , log = require("./log")
  , find = require("./find")
  , asyncMap = require("./async-map")
  , npm = require("../../npm")
  , fs = require("./graceful-fs")

function loadPackageDefaults (pkg, pkgDir, cb) {
  if (!pkg) return cb(new Error("no package to load defaults from!"))
  if (typeof pkgDir === "function") {
    cb = pkgDir
    pkgDir = path.join(npm.dir, pkg.name, pkg.version, "package")
  }

  var cached = npm.get(pkg._id)
  if (cached) pkg = cached
  else npm.set(pkg)

  if (pkg._defaultsLoaded) return cb(null, pkg)

  readDefaultDirs(pkgDir)(pkg, function (er) {
    if (er) return cb(er)
    if (pkg._defaultsLoaded) return cb(null, pkg)
    asyncMap
      ( [pkg]
      , function (pkg, cb) { log.verbose(pkg._id, "loadDefaults", cb) }
      , readDefaultModules(pkgDir)
      , readDefaultBins(pkgDir)
      , readDefaultMans(pkgDir)
      , readDefaultFiles(pkgDir)
      , function (pkg, cb) { pkg._defaultsLoaded = true ; cb() }
      , function (er) { cb(er, pkg) }
      )
  })
}

function addFile (list, f) {
  if (arguments.length === 1) return function (f) {
    addFile(list, f)
  }
  f = f.replace(/^\.\/|^\.$/, "")
  for (var i = 0, l = list.length; i < l; i ++) {
    var e = list[i]
    e = e.replace(/^\.\/|^\.$/, "")
    // obviously.
    if (e === f) return
    // "" means "include everything"
    if (!e) return
    // "foo/" is implied by "foo"
    if (e + "/" === f) return
    // "foo/bar" implies "foo" and "foo/"
    if (e.indexOf(f) === 0
        && (e.charAt(f.length + 1) === "/" || f.slice(-1) === "/")) {
      return
    }
  }
  // not found, so add it.
  list.push(f)
}

function objectForEach (obj, fn) {
  Object.keys(obj).forEach(function (k) {
    fn(obj[k])
  })
}

function readDefaultFiles (pkgDir) { return function (pkg, cb) {
  var list = pkg.files = pkg.files || [""]

  Object.keys(pkg.directories).forEach(addFile(list))

  ;["modules", "bin", "man"].forEach(function (k) {
    objectForEach(pkg[k] || {}, addFile(list))
  })

  addFile(list, "package.json")

  cb(null, pkg)
}}

function readDefaultDirs (pkgDir) { return function (pkg, cb) {
  var dirs = pkg.directories = pkg.directories || {}
    , defaults =
      { lib : "./lib"
      , bin : "./bin"
      , man : "./man"
      , doc : "./doc"
      }
  asyncMap(Object.keys(defaults), function (d, cb) {
    if (dirs[d]) return cb()
    fs.stat(path.join(pkgDir, defaults[d]), function (er, s) {
      if (s && s.isDirectory()) dirs[d] = defaults[d]
      cb()
    })
  }, cb)
}}

function readDefaultMans (pkgDir) { return function (pkg, cb) {
  var man = pkg.directories && pkg.directories.man
    , manDir = path.join(pkgDir, man)
  if (pkg.man && !Array.isArray(pkg.man)) pkg.man = [pkg.man]
  if (pkg.man || !man) return cb(null, pkg)
  find(manDir, /\.[0-9]+(\.gz)?$/, function (er, filenames) {
    if (er) return cb(er)
    pkg.man = filenames.map(function (filename) {
      return filename.substr(pkgDir === "." ? 0 : pkgDir.length + 1)
    })
    cb(null,pkg)
  })
}}

// shim ROOT/{name}-{version}/**/*.js to ROOT/.npm/{name}/{version}/{lib}/**/*.js
function readDefaultModules (pkgDir) { return function (pkg, cb) {
  log.verbose(pkg._id, "readDefaultModules")
  var lib = pkg.directories && pkg.directories.lib || pkg.lib
    , libDir = path.join(pkgDir, lib).replace(/\/+$/, '')
  if (pkg.modules || !lib) return cb(null, pkg)
  // create a modules hash from the lib folder.
  pkg.modules = {}
  find(libDir, function (er, filenames) {
    if (er) return cb(er)
    filenames.forEach(function (filename) {
      // filename = path.basename(filename, path.extname(filename))
      var cut = pkgDir === "." ? 0 : pkgDir.length + 1
        , libCut = pkgDir === "." ? lib.length - 1 : libDir.length + 1
        , key = filename.substr(libCut)
        , val = filename.substr(cut)
      key = key.replace(/\.node$/, ".js")
      if (key.length && val.length) pkg.modules[key] = val
    })
    // require("foo/foo") is dumb, and happens a lot.
    var nameMod = pkg.modules[pkg.name] || pkg.modules[pkg.name+".js"]
    if (!pkg.main
        && !pkg.modules.index
        && !pkg.modules["index.js"]
        && nameMod) {
      pkg.modules["index.js"] = nameMod
    }
    log.silly(pkg.modules, pkg._id+".modules")
    return cb(null, pkg)
  })
}}

function readDefaultBins (pkgDir) { return function (pkg, cb) {
  var bin = pkg.directories && pkg.directories.bin
  if (pkg.bins) pkg.bin = pkg.bins, delete pkg.bins
  if (pkg.bin || !bin) return cb(null, pkg)
  log.verbose("linking default bins", pkg._id)
  var binDir = path.join(pkgDir, bin)
  pkg.bin = {}
  find(binDir, function (er, filenames) {
    if (er) return cb(er)
    var cut = pkgDir === "." ? 0 : pkgDir.length + 1
      , binCut = pkgDir === "." ? bin.length - 1 : binDir.length + 1
    filenames.forEach(function (filename) {
      var key = filename.substr(binCut)
                        .replace(/\.(js|node)$/, '')
        , val = filename.substr(cut)
      if (key.length && val.length) pkg.bin[key] = val
    })
    log.silly(pkg.bin, pkg._id+".bin")
    cb(null, pkg)
  })
}}

