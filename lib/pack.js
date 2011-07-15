// npm pack <pkg>
// Packs the specified package into a .tgz file, which can then
// be installed.

module.exports = pack

var npm = require("../npm")
  , install = require("./install")
  , cache = require("./cache")
  , output = require("./utils/output")
  , fs = require("./utils/graceful-fs")
  , chain = require("./utils/chain")
  , path = require("path")
  , relativize = require("./utils/relativize")
  , cwd = process.cwd()

pack.usage = "npm pack <pkg>"

// if it can be installed, it can be packed.
pack.completion = install.completion

function pack (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  if (args.length === 0) args = ["."]

  chain(args.map(function (arg) { return function (cb) {
    pack_(arg, cb)
  }}).concat(function (er, files) {
    if (er || silent) return cb(er, files)
    printFiles(files, cb)
  }))
}

function printFiles (files, cb) {
  files = files.map(function (file) {
    return relativize(file, cwd)
  })
  output.write(files.join("\n"), cb)
}

// add to cache, then cp to the cwd
function pack_ (pkg, cb) {
  cache.add(pkg, function (er, data) {
    if (er) return cb(er)
    var fname = path.resolve(data._id.replace(/@/g, "-") + ".tgz")
      , cached = path.resolve( npm.cache
                             , data.name
                             , data.version
                             , "package.tgz" )
      , from = fs.createReadStream(cached)
      , to = fs.createWriteStream(fname)
      , errState = null

    from.on("error", cb_)
    to.on("error", cb_)
    to.on("close", cb_)
    from.pipe(to)

    function cb_ (er) {
      if (errState) return
      if (er) return cb(errState = er)
      cb(null, fname)
    }
  })
}
