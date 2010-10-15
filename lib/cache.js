
exports = module.exports = cache
exports.read = read
exports.clean = clean
exports.unpack = unpack

var mkdir = require("./utils/mkdir-p")
  , exec = require("./utils/exec")
  , pipe = exec.pipe
  , spawn = exec.spawn
  , fetch = require("./utils/fetch")
  , npm = require("../npm")
  , fs = require("./utils/graceful-fs")
  , rm = require("./utils/rm-rf")
  , readJson = require("./utils/read-json")
  , registry = require("./utils/registry")
  , log = require("./utils/log")
  , path = require("path")
  , sys = require("sys")

cache.usage = "npm cache add <tarball file>"
            + "\nnpm cache add <folder>"
            + "\nnpm cache add <tarball url>"
            + "\nnpm cache add <name> <version>"
            + "\nnpm cache ls [<path>]"
            + "\nnpm cache clean [<pkg> [<version>]]"

function cache (args, cb) {
  var cmd = args.shift()
  switch (cmd) {
    case "clean": return clean(args, cb)
    case "ls": return ls(args, cb)
    case "add": return add(args, cb)
    default: return cb(new Error(
      "Invalid cache action: "+cmd))
  }
}

// if the pkg and ver are in the cache, then
// just do a readJson and return.
// if they're not, then fetch them from the registry.
var cacheSeen = {}
function read (name, ver, cb) {
  var jsonFile = path.join(npm.cache, name, ver, "package.json")
  function c (er, data) {
    if (!er) cacheSeen[data._id] = data
    return cb(er, data)
  }
  if (name+"@"+ver in cacheSeen) {
    return cb(null, cacheSeen[name+"@"+ver])
  }
  readJson(jsonFile, function (er, data) {
    if (er) return addNameVersion(name, ver, c)
    c(er, data)
  })
}

// npm cache ls [<pkg> [<ver>]]
function ls (args, cb) {
  var show = path.join.apply(path, args)
    , read = npm.cache
    , msg = "cache ls"+(show?" "+show:"")
  read = path.join(read, show)
  mkdir(npm.cache, function (er) {
    if (er) return log.er(cb, "no cache dir")(er)
    fs.readdir(read, function (er, files) {
      if (er) {
        log("nothing found", "cache")
        return cb()
      }
      files = files.filter(function (f) { return f !== "." && f !== ".." })
      if (!files.length) {
        log("nothing found", "cache")
        return cb()
      }
      cb(null, log(files.join("\n"), msg))
    })
  })
}

// npm cache clean [<pkg> [<ver>]]
function clean (args, cb) {
  if (!cb) cb = args, args = []
  if (!args) args = []
  var pkg = args.shift()
    , ver = args.shift()
    , clean = npm.cache
  if (pkg) clean = path.join(clean, pkg)
  if (ver) clean = path.join(clean, ver)
  cb = log.er(cb, "Could not remove "+clean)
  rm(clean, cb)
}


// npm cache add <tarball-url>
// npm cache add <pkg> <ver>
// npm cache add <tarball>
// npm cache add <folder>
exports.add = function (pkg, ver, cb) {
  if (!cb && typeof ver === "function") cb = ver, ver = null
  return add([pkg, ver], cb)
}
function add (args, cb) {
  var pkg = args.shift()
    , ver = args.shift()
  if (!pkg && !ver) {
    var usage = "Usage:\n"
              + "    npm cache add <tarball-url>\n"
              + "    npm cache add <pkg> <ver>\n"
              + "    npm cache add <tarball>\n"
              + "    npm cache add <folder>\n"
    return cb(new Error(usage))
  }
  if (pkg && ver) return addNameVersion(pkg, ver, cb)
  if (pkg.match(/^https?:\/\//)) return addRemoteTarball(pkg, cb)
  else addLocal(pkg, cb)
}
function addRemoteTarball (url, cb) {
  var tmp = path.join(npm.tmp, Date.now()+"-"+Math.random()+".tgz")
  fetch(url, tmp, function (er) {
    if (er) return log.er(cb, "failed to fetch "+url)(er)
    addLocalTarball(tmp, cb)
  })
}
function addNameVersion (name, ver, cb) {
  registry.get(name, ver, function (er, data, json) {
    if (er) return cb(er)
    var folder = path.join(npm.cache, data.name, data.version)
      , tgz = path.join(folder, "package.tgz")
    mkdir(folder, function (er) {
      if (er) return cb(er)
      if (!data.dist || !data.dist.tarball) return cb(new Error(
        "No dist.tarball in package data"))
      fetch(data.dist.tarball, tgz, function (er) {
        if (er) return cb(er)
        addLocalTarball(tgz, cb)
      })
    })
  })
}

function addLocal (p, cb) {
  // figure out if this is a folder or file.
  fs.stat(p, function (er, s) {
    if (er) return log.er(cb, "Doesn't exist: "+p)(er)
    if (s.isDirectory()) addLocalDirectory(p, cb)
    else addLocalTarball(p, cb)
  })
}
function addLocalTarball (p, cb) {
  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  var tmp = path.join(npm.tmp, Date.now() + "-" + Math.random())
  if (p.indexOf(npm.cache) !== 0) {
    return unpackTar(p, tmp, function (er) {
      if (er) return log.er(cb, "Failed to unpack "+p)(er)
      addLocalDirectory(tmp, function (er, data) {
        if (er) cb(er)
        rm(tmp, function (er) {
          if (er) return log.er(cb, "Could not remove "+tmp)
          cb(er, data)
        })
      })
    })
  }
  if (path.basename(p) !== "package.tgz") return cb(new Error(
    "Not a valid cache tarball name: "+p))
  addPlacedTarball(p, cb)
}
function addPlacedTarball (p, cb) {
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")
    , json = path.join(target, "package.json")
  rm(folder, function (e) {
    if (e) return log.er(cb, "Could not remove "+folder)(er)
    unpackTar(p, folder, function (er) {
      if (er) return cb(er)
      readJson(path.join(folder, "package.json"), function (er, data) {
        if (er) return cb(er)
        fs.writeFile(json, JSON.stringify(data), function (er) {
          if (er) return log.er(cb, "Could not write to "+json)(er)
          cb(null, data)
        })
      })
    })
  })
}
function addLocalDirectory (p, cb) {
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (p.indexOf(npm.cache) === 0) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  readJson(path.join(p, "package.json"), function (er, data) {
    if (er) return cb(er)
    var tgz = path.join(npm.cache, data.name, data.version, "package.tgz")
    packTar(tgz, p, function (er) {
      if (er) return cb(er)
      addLocalTarball(tgz, cb)
    })
  })
}

function unpack (pkg, ver, unpackTarget, cb) {
  read(pkg, ver, function (er, data) {
    if (er) return log.er(cb, "Could not read data for "+pkg+"@"+ver)(er)
    unpackTar( path.join(npm.cache, pkg, ver, "package.tgz")
             , unpackTarget
             , cb
             )
  })
}

function unpackTar (tarball, unpackTarget, cb) {
  mkdir(unpackTarget, function (er) {
    if (er) return log.er(cb, "Could not create "+unpackTarget)(er)
    // cp the gzip of the tarball, pipe the stdout into tar's stdin
    // gzip {tarball} --decompress --stdout | tar xf - --strip-components=1 -C {unpackTarget}
    pipe( spawn(npm.config.get("gzipbin"), ["--decompress", "--stdout", tarball])
        , spawn( npm.config.get("tar")
               , ["vxpf", "-", "--strip-components=1", "-C", unpackTarget]
               )
        , log.er(cb, "Failed unpacking the tarball.\n"
                   + "This is very rare. Perhaps the 'gzip' or 'tar' configs\n"
                   + "are set improperly?\n")
        )
  })
}
function packTar (targetTarball, folder, cb) {
  log.verbose(folder+" "+targetTarball, "packTar")
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  if (folder.slice(-1) === "/") folder = folder.slice(0, -1)
  var cwd = process.cwd()
    , parent = path.dirname(folder)
    , addFolder = path.basename(folder)
    , ignore = path.join(folder, ".npmignore")
    , defaultIgnore = path.join(__dirname, "utils", "default.npmignore")
    , include = path.join(folder, ".npminclude")
  cb = log.er(cb, "Failed creating the tarball.\n"
             + "This is very rare. Perhaps the 'gzip' or 'tar' configs\n"
             + "are set improperly?\n")

  fs.stat(ignore, function (er) {
    if (er) ignore = defaultIgnore
    fs.stat(include, function (er) {
      if (er) include = false
      mkdir(path.dirname(targetTarball), function (er) {
        if (er) return log.er(cb, "Could not create "+targetTarball)(er)
        process.chdir(parent)
        // tar xf - --strip-components=1 -C {unpackTarget} | gzip {tarball} > targetTarball
        var target = fs.createWriteStream(targetTarball)
          , unPacked = false
          , args = [ "cv", "--exclude", ".git", "-X", ignore]
        if (include) args.push("-T", include)
        args.push(addFolder)
        var tar = spawn(npm.config.get("tar"), args)
          , gzip = spawn(npm.config.get("gzipbin"), ["--stdout"])
          , errState
        pipe(tar, gzip, function (er) {
          if (errState) return
          if (er) return cb(errState = er)
        })
        sys.pump(gzip.stdout, target, function (er, ok) {
          if (errState) return
          if (er) return cb(errState = er)
          process.chdir(cwd)
          cb()
        })
      })
    })
  })
}
