
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
  if (!pkgDir) pkgDir = "."

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

  ;["directories", "bin", "man"].forEach(function (k) {
    objectForEach(pkg[k] || {}, addFile(list))
  })

  addFile(list, "package.json")

  cb(null, pkg)
}}

function readDefaultDirs (pkgDir) { return function (pkg, cb) {
  if (pkg.directories && typeof pkg.directories !== "object"
      || Array.isArray(pkg.directories)) {
    log.warn(pkg.directories, pkg._id + ": invalid 'directories' field")
    delete pkg.directories
  }
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
    var cut = pkgDir === "." ? 0 : pkgDir.length + 1
    pkg.man = filenames.map(function (filename) {
      return filename.substr(cut)
    }).filter(function (f) {
      return !f.match(/(^|\/)\./)
    })
    cb(null,pkg)
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
    filenames.filter(function (f) {
      return !f.substr(binCut).match(/(^|\/)\./)
    }).forEach(function (filename) {
      var key = filename.substr(binCut)
                        .replace(/\.(js|node)$/, '')
        , val = filename.substr(cut)
      if (key.length && val.length) pkg.bin[key] = val
    })
    log.silly(pkg.bin, pkg._id+".bin")
    cb(null, pkg)
  })
}}

