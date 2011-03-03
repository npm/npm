
/*
new technique for tarring

goal:
1. get rid of the -C and --strip-components nonsense
2. always have a consistent folder name in the package.tgz files

adding a folder:
1. tar into tmp/random/package.tgz
2. untar into tmp/random/contents/{blah}
3. rename {blah} to "package"
4. tar tmp/random/package to cache/n/v/package.tgz
5. untar cache/n/v/package.tgz into cache/n/v/package
6. rm tmp/random and tmp/random.tgz

Adding a url:
1. fetch to tmp/random.tgz
2. goto folder(2)

adding a name/version:
1. registry.get(name, version)
2. if response isn't 304, add url(dist.tarball)

adding a local tarball:
1. untar to tmp/random/{blah}
2. goto folder(2)
*/

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
  , sys = require("./utils/sys")
  , output = require("./utils/output")
  , sha = require("./utils/sha")
  , find = require("./utils/find")
  , asyncMap = require("./utils/async-map")
  , uidNumber = require("./utils/uid-number")

var FMODE = 0644
  , DMODE = 0755

cache.usage = "npm cache add <tarball file>"
            + "\nnpm cache add <folder>"
            + "\nnpm cache add <tarball url>"
            + "\nnpm cache add <name>@<version>"
            + "\nnpm cache ls [<path>]"
            + "\nnpm cache clean [<pkg>[@<version>]]"

cache.completion = function(args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , subcmdList = ["add", "clean", "ls"]
    , subcmd = args[0] || ""
    , onSubCmd = index === 2

  if (onSubCmd) return cb(null, getCompletions(subcmd, subcmdList))
  if (subcmd === "add") {
    return remotePkgs(args.slice(1), index - 1, true, false, false, cb)
  }
  // at this point, the only args that matter are after the subcmd
  index -= 3
  args = args.slice(1)
  var p = args.join("/").split("@").join("/").split("/")
    , cur = index < args.length ? p.pop() : ""
  p = p.join("/")

  // p is what we should ls_ for, cur is what we filter on
  return ls_(p, 3, function (er, files) {
    if (files) {
      files = getCompletions((p ? p+"/" : "")+cur, files)
    }
    if (!files || !files.length) {
      er = new Error("nothing found")
      files = null
    }
    cb(er, files)
  })
}

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
    if (data) deprCheck(data)
    return cb(er, data)
  }
  if (npm.config.get("force")) {
    log.verbose(true, "force found, skipping cache")
    return addNameVersion(name, ver, c)
  }

  if (name+"@"+ver in cacheSeen) {
    return cb(null, cacheSeen[name+"@"+ver])
  }
  readJson(jsonFile, function (er, data) {
    if (er) return addNameVersion(name, ver, c)
    deprCheck(data)
    c(er, data)
  })
}

// npm cache ls [<path>]
function ls (args, cb) {
  args = args.join("/").split("@").join("/")
  if (args.substr(-1) === "/") args = args.substr(0, args.length - 1)
  ls_(args, function(er, files) {
    files = files || []
    output.write(npm.config.get("outfd"), files.join("\n"), cb_)
    function cb_ () { cb(null, files) }
  })
}

// Calls cb with list of cached pkgs matching show.
function ls_ (req, depth, cb) {
  if (typeof cb !== "function") cb = depth, depth = 1
  mkdir(npm.cache, function (er) {
    if (er) return log.er(cb, "no cache dir")(er)
    function dirFilter (f, type) {
      return type !== "dir" ||
        ( f && f !== npm.cache + "/" + req
         && f !== npm.cache + "/" + req + "/" )
    }
    find(path.join(npm.cache, req), dirFilter, depth, function (er, files) {
      if (er) return cb(er)
      return cb(null, files.map(function (f) {
        f = f.substr(npm.cache.length + 1)
        f = f.substr((f === req ? path.dirname(req) : req).length)
             .replace(/^\//, '')
        return f
      }))
    })
  })
}
// npm cache clean [<path>]
function clean (args, cb) {
  if (!cb) cb = args, args = []
  if (!args) args = []
  args = args.join("/").split("@").join("/")
  if (args.substr(-1) === "/") args = args.substr(0, args.length - 1)
  var f = path.join(npm.cache, path.normalize(args))
  if (f === npm.cache) {
    fs.readdir(npm.cache, function (er, files) {
      if (er) return cb()
      asyncMap( files.map(function (f) { return path.join(npm.cache, f) })
              , rm, cb )
    })
  } else rm(path.join(npm.cache, path.normalize(args)), cb)
}

// npm cache add <tarball-url>
// npm cache add <pkg> <ver>
// npm cache add <tarball>
// npm cache add <folder>
exports.add = function (pkg, ver, scrub, cb) {
  if (typeof cb !== "function") cb = scrub, scrub = false
  if (scrub) {
    return clean([], function (er) {
      if (er) return cb(er)
      add([pkg, ver], cb)
    })
  }
  log.verbose([pkg, ver], "cache add")
  if (!cb && typeof ver === "function") cb = ver, ver = null
  return add([pkg, ver], cb)
}
function add (args, cb) {
  if (args[0] && args[0].indexOf("@") !== -1) {
    args = args[0].split("@")
  }
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

function addRemoteTarball (url, shasum, name, cb) {
  if (!cb) cb = name, name = ""
  if (!cb) cb = shasum, shasum = null
  log.verbose([url, shasum], "addRemoteTarball")
  // todo: take a shasum, and validate it.
  var tmp = path.join(npm.tmp, Date.now()+"-"+Math.random(), "tmp.tgz")
  mkdir(path.dirname(tmp), function (er) {
    if (er) return cb(er)
    fetch(url, tmp, function (er) {
      if (er) return log.er(cb, "failed to fetch "+url)(er)
      if (!shasum) return done()
      // validate that the url we just downloaded matches the expected shasum.
      sha.check(tmp, shasum, done)
    })
  })
  function done (er) {
    if (er) return cb(er)
    addLocalTarball(tmp, name, cb)
  }
}

function addNameVersion (name, ver, cb) {
  registry.get(name, ver, function (er, data, json, response) {
    if (er) return cb(er)
    deprCheck(data)
    if (!data.dist || !data.dist.tarball) return cb(new Error(
      "No dist.tarball in package data"))
    //TODO: put the shasum in the data, and pass to addRemoteTarball
    if (response.statusCode !== 304 || npm.config.get("force")) return fetchit()
    // we got cached data, so let's see if we have a tarball.
    fs.stat(path.join(npm.cache, name, ver, "package.tgz"), function (er, s) {
      if (!er) return cb(null, data)
      else return fetchit()
    })
    function fetchit () {
      return addRemoteTarball( data.dist.tarball.replace(/^https/,'http')
                             , data.dist.shasum, name+"-"+ver, cb)
    }
  })
}

function addLocal (p, name, cb) {
  if (!cb) cb = name, name = ""
  // figure out if this is a folder or file.
  fs.stat(p, function (er, s) {
    if (er) return log.er(cb, "Doesn't exist: "+p)(er)
    if (s.isDirectory()) addLocalDirectory(p, name, cb)
    else addLocalTarball(p, name, cb)
  })
}

function addLocalTarball (p, name, cb) {
  if (!cb) cb = name, name = ""
  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  if (p.indexOf(npm.tmp) === 0) return addTmpTarball(p, name, cb)

  if (p.indexOf(npm.cache) === 0) {
    if (path.basename(p) !== "package.tgz") return cb(new Error(
      "Not a valid cache tarball name: "+p))
    return addPlacedTarball(p, name, cb)
  }

  // just copy it over and then add the temp tarball file.
  var tmp = path.join(npm.tmp, name + Date.now()
                             + "-" + Math.random(), "tmp.tgz")
  mkdir(path.dirname(tmp), function (er) {
    if (er) return cb(er)
    var from = fs.createReadStream(p)
      , to = fs.createWriteStream(tmp)
      , errState = null
    function errHandler (er) {
      if (errState) return
      return cb(errState = er)
    }
    from.on("error", errHandler)
    to.on("error", errHandler)
    to.on("close", function () {
      if (errState) return
      fs.chmod(tmp, FMODE, function (er) {
        if (er) return cb(er)
        addTmpTarball(tmp, name, cb)
      })
    })
    sys.pump(from, to)
  })
}

function addPlacedTarball (p, name, cb) {
  if (!cb) cb = name, name = ""
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")
    , json = path.join(target, "package.json")
  rm(folder, function (er) {
    if (er) return log.er(cb, "Could not remove "+folder)(er)
    unpackTar(p, target, function (er) {
      if (er) return log.er(cb, "Could not unpack "+p+" to "+target)(er)
      // calculate the sha of the file that we just unpacked.
      // this is so that the data is available when publishing.
      sha.get(p, function (er, shasum) {
        if (er) return log.er(cb, "couldn't validate shasum of "+p)(er)
        readJson(path.join(folder, "package.json"), function (er, data) {
          if (er) return log.er(cb, "coulnd't read json in "+folder)(er)
          data.dist = data.dist || {}
          if (shasum) data.dist.shasum = shasum
          deprCheck(data)
          fs.writeFile(json, JSON.stringify(data,null,2), function (er) {
            if (er) return log.er(cb, "Could not write to "+json)(er)
            asyncMap([json, p], function (f, cb) {
              fs.chmod(f, FMODE, cb)
            }, function (er) {
              cb(er, data)
            })
          })
        })
      })
    })
  })
}

function addLocalDirectory (p, name, cb) {
  if (!cb) cb = name, name = ""
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (p.indexOf(npm.cache) === 0) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  if (npm.dir.indexOf(p) === 0 || p.indexOf(npm.dir) === 0) {
    return cb(new Error("Adding npm dir into cache, not allowed"))
  }
  readJson(path.join(p, "package.json"), function (er, data) {
    if (er) return log.er(cb, "couldn't read package.json in "+p)(er)
    deprCheck(data)
    var random = Date.now() + "-" + Math.random()
      , tmp = path.join(npm.tmp, random)
      , tmptgz = path.join(tmp, "tmp.tgz")
      , placed = path.join(npm.cache, data.name, data.version, "package.tgz")
      , tgz = path.basename(p) === "package" ? placed : tmptgz
    packTar(tgz, p, data, function (er) {
      if (er) return log.er(cb,"couldn't pack "+p+ " to "+tgz)(er)
      addLocalTarball(tgz, name, cb)
    })
  })
}

function addTmpTarball (tgz, name, cb) {
  if (!cb) cb = name, name = ""
  var contents = path.join(path.dirname(tgz),"contents")
  unpackTar(tgz, contents, function (er) {
    if (er) return log.er(cb, "couldn't unpack "+tgz+" to "+contents)(er)
    fs.readdir(contents, function (er, folder) {
      if (er) return log.er(cb, "couldn't readdir "+contents)(er)
      log.verbose(folder, "tarball contents")
      if (folder.length > 1) {
        folder = folder.filter(function (f) { return !f.match(/^\./) })
      }
      if (folder.length > 1) {
        log.warn(folder.slice(1).join("\n")
                ,"extra junk in folder, ignoring")
      }
      if (!folder.length) return cb(new Error("Empty package tarball"))
      folder = path.join(contents, folder[0])
      var newName = path.join(contents, "package")
      fs.rename(folder, newName, function (er) {
        if (er) return log.er(cb, "couldn't rename "+folder+" to package")(er)
        addLocalDirectory(newName, name, cb)
      })
    })
  })
}

function unpack (pkg, ver, unpackTarget, dMode, fMode, uid, gid, cb) {
  read(pkg, ver, function (er, data) {
    if (er) return log.er(cb, "Could not read data for "+pkg+"@"+ver)(er)
    unpackTar( path.join(npm.cache, pkg, ver, "package.tgz")
             , unpackTarget
             , dMode, fMode
             , uid, gid
             , cb )
  })
}

function unpackTar (tarball, unpackTarget, dMode, fMode, uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = fMode, fMode = FMODE
  if (typeof cb !== "function") cb = dMode, dMode = DMODE

  uidNumber(uid, gid, function (er, uid, gid) {
    if (er) return cb(er)
    unpackTar_(tarball, unpackTarget, dMode, fMode, uid, gid, cb)
  })
}

function unpackTar_ ( tarball, unpackTarget, dMode, fMode, uid, gid, cb ) {
  mkdir(unpackTarget, dMode || DMODE, uid, gid, function (er) {
    log.verbose([uid, gid], "unpackTar_ uid, gid")
    if (er) return log.er(cb, "Could not create "+unpackTarget)(er)
    // cp the gzip of the tarball, pipe the stdout into tar's stdin
    // gzip {tarball} --decompress --stdout | tar xf - --strip-components=1 -C {unpackTarget}
    pipe( spawn( npm.config.get("gzipbin")
               , ["--decompress", "--stdout", tarball]
               , process.env, false )
        , spawn( npm.config.get("tar")
               , ["-mvxpf", "-", "-C", unpackTarget]
               , process.env, false )
        , function (er) {
            // if we're not doing ownership management,
            // then we're done now.
            if (er) return log.er(cb,
              "Failed unpacking "+tarball+" to "+unpackTarget)(er)
            if (npm.config.get("unsafe-perm")) {
              if (!process.getuid || !process.getgid) return cb(er)
              uid = process.getuid()
              gid = process.getgid()
              if (uid === 0) {
                if (process.env.SUDO_UID) uid = +process.env.SUDO_UID
                if (process.env.SUDO_GID) gid = +process.env.SUDO_GID
              }
            }
            find(unpackTarget, function (f) {
              return f !== unpackTarget
            }, function (er, files) {
              if (er) return cb(er)
              asyncMap(files, function (f, cb) {
                fs.lstat(f, function (er, stat) {
                  if (er || stat.isSymbolicLink()) return cb(er)
                  fs.chown(f, uid, gid, function (er) {
                    if (er) return cb(er)
                    var mode = stat.isDirectory() ? dMode : fMode
                      , oldMode = stat.mode & 0777
                      , newMode = oldMode | mode
                    if (mode && newMode !== oldMode) fs.chmod(f, newMode, cb)
                    else cb()
                  })
                })
              }, function (er) {
                if (er) return cb(er)
                fs.chown(unpackTarget, process.getuid(), process.getgid(), cb)
              })
            })
          }
        )
  })
}

var publishEverythingWarning = {}
function packTar (targetTarball, folder, pkg, cb) {
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  if (folder.slice(-1) === "/") folder = folder.slice(0, -1)
  if (typeof pkg === "function") {
    cb = pkg, pkg = null
    return readJson(path.join(folder, "package.json"), function (er, pkg) {
      if (er) return log.er(cb, "Couldn't find package.json in "+folder)(er)
      packTar(targetTarball, folder, pkg, cb)
    })
  }
  log.verbose(folder+" "+targetTarball, "packTar")
  var parent = path.dirname(folder)
    , addFolder = path.basename(folder)
    , ignore = path.join(folder, ".npmignore")
    , defaultIgnore = path.join(__dirname, "utils", "default.npmignore")
    , customIgnore = false

  cb = log.er(cb, "Failed creating the tarball.")

  fs.stat(ignore, function (er) {
    if (er) ignore = defaultIgnore
    else customIgnore = true
    mkdir(path.dirname(targetTarball), function (er) {
      if (er) return log.er(cb, "Could not create "+targetTarball)(er)
      // tar xf - --strip-components=1 -C {unpackTarget} \
      //   | gzip {tarball} > targetTarball
      var target = fs.createWriteStream(targetTarball)
        , unPacked = false
        , args = [ "-cvf", "-", "--exclude", ".git", "-X", ignore]
        , tarEnv = {}
      for (var i in process.env) {
        tarEnv[i] = process.env[i]
      }
      // Sometimes you make it hard to love you, OS X.
      tarEnv.COPY_EXTENDED_ATTRIBUTES_DISABLE = "true"
      tarEnv.COPYFILE_DISABLE = "true"
      if (!pkg.files
          && !publishEverythingWarning[pkg._id]
          && !customIgnore) {
        publishEverythingWarning[pkg._id] = true
        log.warn("Adding entire directory to tarball. Please add a\n"
                +".npmignore or specify a 'files' array in the package.json"
                ,"publish-everything "+pkg._id)
      }
      if (!pkg.files) pkg.files = [""]
      args.push.apply(args, pkg.files.map(function (f) {
        // the second path.join is to prevent escapes.
        return path.join(addFolder, path.join("/", f))
      }))
      var tar = spawn(npm.config.get("tar"), args, tarEnv, false, parent)
        , gzip = spawn( npm.config.get("gzipbin"), ["--stdout"]
                      , null, false, parent )
        , errState
      pipe(tar, gzip, function (er) {
        if (errState) return
        if (er) return cb(errState = er)
      })
      sys.pump(gzip.stdout, target)
      target.on("close", function (er, ok) {
        if (errState) return
        if (er) return cb(errState = er)
        fs.chmod(targetTarball, 0644, function (er) {
          if (errState) return
          return cb(errState = er)
        })
      })
    })
  })
}

var deprecated = {}
  , deprWarned = {}
function deprCheck (data) {
  if (deprecated[data._id]) data.deprecated = deprecated[data._id]
  if (data.deprecated) deprecated[data._id] = data.deprecated
  else return
  if (!deprWarned[data._id]) {
    deprWarned[data._id] = true
    log.warn(data._id+": "+data.deprecated, "deprecated")
  }
}

// holy jesus FUCK this file is getting big...
