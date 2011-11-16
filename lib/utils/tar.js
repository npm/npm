// commands for packing and unpacking tarballs
// this file is used by lib/cache.js

var npm = require("../npm.js")
  , fs = require("graceful-fs")
  , exec = require("./exec.js")
  , spawn = exec.spawn
  , pipe = exec.pipe
  , find = require("./find.js")
  , mkdir = require("./mkdir-p.js")
  , asyncMap = require("slide").asyncMap
  , path = require("path")
  , log = require("./log.js")
  , uidNumber = require("./uid-number.js")
  , rm = require("rimraf")
  , readJson = require("./read-json.js")
  , relativize = require("./relativize.js")
  , cache = require("../cache.js")
  , excludes = require("./excludes.js")
  , myUid = process.getuid && process.getuid()
  , myGid = process.getgid && process.getgid()

exports.pack = pack
exports.unpack = unpack
exports.makeList = makeList

var packQueue = []
  , packing = false

function pack (targetTarball, folder, pkg, dfc, cb_) {
  if (typeof cb_ !== "function") cb_ = dfc, dfc = true
  folder = path.resolve(process.cwd(), folder)
  if (typeof pkg === "function") {
    cb_ = pkg, pkg = null
    return readJson(path.resolve(folder, "package.json"), function (er, pkg) {
      if (er) return log.er(cb_, "Couldn't find package.json in "+folder)(er)
      pack(targetTarball, folder, pkg, dfc, cb_)
    })
  }
  log.verbose(folder+" "+targetTarball, "pack")
  var parent = path.dirname(folder)
    , addFolder = path.basename(folder)

  cb_ = log.er(cb_, "Failed creating the tarball.")


  // XXX Rip out all this crap and use a tar get gets along with windows.
  if (packing && process.platform === "win32") {
    packQueue.push([targetTarball, folder, pkg, dfc, cb_])
    return
  }

  packing = true
  function cb (er, data) {
    packing = false
    var next = packQueue.shift()
    if (next) return pack.apply(null, next)
    cb_(er, data)
  }

  var confEx = npm.config.get("ignore")
  log.silly(folder, "makeList")
  makeList(folder, pkg, dfc, function (er, files, cleanup) {
    if (er) return cb(er)
    return packFiles(targetTarball, parent, files, pkg, function (er) {
      if (!cleanup || !cleanup.length) return cb(er)
      // try to be a good citizen, even/especially in the event of failure.
      cleanupResolveLinkDep(cleanup, function (er2) {
        if (er || er2) {
          if (er) log(er, "packing tarball")
          if (er2) log(er2, "while cleaning up resolved deps")
        }
        return cb(er || er2)
      })
    })
  })
}

function packFiles (targetTarball, parent, files, pkg, cb) {
  mkdir(path.dirname(targetTarball), function (er) {
    if (er) return log.er(cb, "Could not create "+targetTarball)(er)
    log.verbose(path.dirname(targetTarball), "mkdir'ed")
    // tar xf - --strip-components=1 -C {unpackTarget} \
    //   | gzip {tarball} > targetTarball
    // HACK tar on windows likes forward slashes
    if (process.platform === "win32") files = files.map(function(f) {
      return f.replace(/\\/g, "/")
    })
    var target = fs.createWriteStream(targetTarball)
      , unPacked = false
      , args = [ "-czvf", "-", "-T", "-"]
      , tarEnv = {}
    for (var i in process.env) {
      tarEnv[i] = process.env[i]
    }
    // Sometimes you make it hard to love you, OS X.
    tarEnv.COPY_EXTENDED_ATTRIBUTES_DISABLE = "true"
    tarEnv.COPYFILE_DISABLE = "true"

    log.verbose("about to write tar and gzip it.", "tar")

    log.silly(args, "tar args")

    var tar = spawn( npm.config.get("tar")
                   , args, tarEnv, false, parent)
      , errState
    tar.stdin.write(files.join("\n"))
    tar.stdin.end()
    tar.stdout.pipe(target)
    target.on("close", function (er, ok) {
      if (errState) return
      if (er) return cb(errState = er)
      fs.chmod(targetTarball, npm.modes.file, function (er) {
        if (errState) return
        return cb(errState = er)
      })
    })
  })
}


function unpack (tarball, unpackTarget, dMode, fMode, uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = fMode, fMode = npm.modes.file
  if (typeof cb !== "function") cb = dMode, dMode = npm.modes.exec

  uidNumber(uid, gid, function (er, uid, gid) {
    if (er) return cb(er)
    unpack_(tarball, unpackTarget, dMode, fMode, uid, gid, cb)
  })
}

// XXX Rip all this crap out and use a tar that gets along with windows.
var unpackQueue = []
  , unpacking = false

function unpack_ ( tarball, unpackTarget, dMode, fMode, uid, gid, cb_ ) {
  if (unpacking && process.platform === "win32") {
    unpackQueue.push([tarball, unpackTarget, dMode, fMode, uid, gid, cb_])
    return
  }

  unpacking = true
  function cb (er, data) {
    unpacking = false
    var next = unpackQueue.shift()
    if (next) return unpack_.apply(null, next)
    cb_(er, data)
  }

  // If the desired target is /path/to/foo,
  // then unpack into /path/to/.foo.npm/{something}
  // rename that to /path/to/foo, and delete /path/to/.foo.npm
  var parent = path.dirname(unpackTarget)
    , base = path.basename(unpackTarget)
    , tmp = path.resolve(parent, "___" + base + ".npm")

  mkdir(tmp, dMode || npm.modes.exec, uid, gid, function (er) {
    log.verbose([uid, gid], "unpack_ uid, gid")
    log.verbose(unpackTarget, "unpackTarget")
    if (er) return log.er(cb, "Could not create "+tmp)(er)
    // cp the gzip of the tarball, pipe the stdout into tar's stdin
    // gzip {tarball} --decompress --stdout \
    //   | tar -mvxpf - --strip-components=1 -C {unpackTarget}
    gunzTarPerm( tarball, tmp
               , dMode, fMode
               , uid, gid
               , function (er, folder) {
      if (er) return cb(er)
      log.verbose(folder, "gunzed")
      rm(unpackTarget, function (er) {
        if (er) return cb(er)
        log.verbose(unpackTarget, "rm'ed")
        fs.rename(folder, unpackTarget, function (er) {
          if (er) return cb(er)
          log.verbose([folder, unpackTarget], "renamed")
          // curse you, nfs!  It will lie and tell you that the
          // mv is done, when in fact, it isn't.  In theory,
          // reading the file should cause it to wait until it's done.
          readJson( path.resolve(unpackTarget, "package.json")
                  , function (er, data) {
            // now we read the json, so we know it's there.
            rm(tmp, function (er2) { cb(er || er2, data) })
          })
        })
      })
    })
  })
}

function gunzTarPerm (tarball, tmp, dMode, fMode, uid, gid, cb) {
  if (!dMode) dMode = npm.modes.exec
  if (!fMode) fMode = npm.modes.file
  log.silly([dMode.toString(8), fMode.toString(8)], "gunzTarPerm modes")

  // HACK tar on windows prefers forward slashes (or double backslashes)
  var tmpTar = process.platform === "win32" ? tmp.replace(/\\/g, "/") : tmp
    , tarArgs = ["-zmvxpf", tarball]

  if (process.platform !== "win32" && 0 === process.getuid()) {
    tarArgs.push("-o")
  }

  var tar = spawn( npm.config.get("tar")
                 , tarArgs
                 , process.env, false, tmpTar )

  tar.on("exit", function (code) {
    log.silly(code, "tar exit")
    var er
    // HACK exit=1 on win32 usually means that there were symlinks.
    // Just soldier on.
    if (code === 1 && process.platform === "win32") {
      return afterUntar()
    }
    if (code) er = new Error("`" + tar.name + "`\nfailed with "+code)
    afterUntar(er)
  })

  tar.stdout.on("data", function (c) {
    c = c.toString().trim()
    if (!c.length) return
    log.silly(c, "tar out")
  })

  tar.stderr.on("data", function (c) {
    c = c.toString().trim()
    if (!c.length) return
    log.silly(c, "tar err")
  })

  function afterUntar (er) {
    // if we're not doing ownership management,
    // then we're done now.
    if (er) return log.er(cb, "Failed unpacking "+tarball)(er)

    // HACK skip on windows
    if (npm.config.get("unsafe-perm") && process.platform !== "win32") {
      uid = process.getuid()
      gid = process.getgid()
      if (uid === 0) {
        if (process.env.SUDO_UID) uid = +process.env.SUDO_UID
        if (process.env.SUDO_GID) gid = +process.env.SUDO_GID
      }
    }

    if (process.platform === "win32") {
      return fs.readdir(tmp, function (er, files) {
        files = files.filter(function (f) {
          return f && f.indexOf("\0") === -1
        })
        log.silly("skip chmod for windows")
        cb(er, files && path.resolve(tmp, files[0]))
      })
    }

    find(tmp, function (f) {
      return f !== tmp
    }, function (er, files) {
      if (er) return cb(er)
      asyncMap(files, function (f, cb) {
        f = path.resolve(f)
        log.silly(f, "asyncMap in gTP")
        fs.lstat(f, function (er, stat) {

          if (er || stat.isSymbolicLink()) return cb(er)
          if (typeof uid === "number" && typeof gid === "number") {
            fs.chown(f, uid, gid, chown)
          } else chown()

          function chown (er) {
            if (er) return cb(er)
            var mode = stat.isDirectory() ? dMode : fMode
              , oldMode = stat.mode & 0777
              , newMode = (oldMode | mode) & (~npm.modes.umask)
            if (mode && newMode !== oldMode) {
              log.silly(newMode.toString(8), "chmod "+path.basename(f))
              fs.chmod(f, newMode, cb)
            } else cb()
          }
        })
      }, function (er) {

        if (er) return cb(er)
        if (typeof myUid === "number" && typeof myGid === "number") {
          fs.chown(tmp, myUid, myGid, chown)
        } else chown()

        function chown (er) {
          if (er) return cb(er)
          fs.readdir(tmp, function (er, folder) {
            folder = folder && folder.filter(function (f) {
              return f && !f.match(/^\._/)
            })
            cb(er, folder && path.resolve(tmp, folder[0]))
          })
        }
      })
    })
  }
}

function makeList (dir, pkg, dfc, cb) {
  if (typeof cb !== "function") cb = dfc, dfc = true
  if (typeof cb !== "function") cb = pkg, pkg = null
  dir = path.resolve(dir)

  if (!pkg.path) pkg.path = dir

  var name = path.basename(dir)

  // since this is a top-level traversal, get the user and global
  // exclude files, as well as the "ignore" config setting.
  var confIgnore = npm.config.get("ignore").trim()
        .split(/[\n\r\s\t]+/)
        .filter(function (i) { return i.trim() })
    , userIgnore = npm.config.get("userignorefile")
    , globalIgnore = npm.config.get("globalignorefile")
    , userExclude
    , globalExclude

  confIgnore.dir = dir
  confIgnore.name = "confIgnore"

  var defIgnore = ["build/"]
  defIgnore.dir = dir

  // TODO: only look these up once, and cache outside this function
  excludes.parseIgnoreFile( userIgnore, null, dir
                          , function (er, uex) {
    if (er) return cb(er)
    userExclude = uex
    next()
  })

  excludes.parseIgnoreFile( globalIgnore, null, dir
                          , function (er, gex) {
    if (er) return cb(er)
    globalExclude = gex
    next()
  })

  function next () {
    if (!globalExclude || !userExclude) return
    var exList = [ defIgnore, confIgnore, globalExclude, userExclude ]

    makeList_(dir, pkg, exList, dfc, function (er, files, cleanup) {
      if (er) return cb(er)
      var dirLen = dir.length + 1
      files = files.map(function (file) {
        return path.join(name, file.substr(dirLen))
      })
      return cb(null, files, cleanup)
    })
  }
}

// Patterns ending in slashes will only match targets
// ending in slashes.  To implement this, add a / to
// the filename iff it lstats isDirectory()
function readDir (dir, pkg, dfc, cb) {
  fs.readdir(dir, function (er, files) {
    if (er) return cb(er)
    files = files.filter(function (f) {
      return f && f.charAt(0) !== "/" && f.indexOf("\0") === -1
    })
    asyncMap(files, function (file, cb) {
      fs.lstat(path.resolve(dir, file), function (er, st) {
        if (er) return cb(null, [])
        // if it's a directory, then tack "/" onto the name
        // so that it can match dir-only patterns in the
        // include/exclude logic later.
        if (st.isDirectory()) return cb(null, file + "/")

        // if it's a symlink, then we need to do some more
        // complex stuff for GH-691
        if (st.isSymbolicLink()) return readSymlink(dir, file, pkg, dfc, cb)

        // otherwise, just let it on through.
        return cb(null, file)
      })
    }, cb)
  })
}

// just see where this link is pointing, and resolve relative paths.
function shallowReal (link, cb) {
  link = path.resolve(link)
  fs.readlink(link, function (er, t) {
    if (er) return cb(er)
    return cb(null, path.resolve(path.dirname(link), t), t)
  })
}

function readSymlink (dir, file, pkg, dfc, cb) {
  var isNM = dfc
           && path.basename(dir) === "node_modules"
           && path.dirname(dir) === pkg.path
  // see if this thing is pointing outside of the package.
  // external symlinks are resolved for deps, ignored for other things.
  // internal symlinks are allowed through.
  var df = path.resolve(dir, file)
  shallowReal(df, function (er, r, target) {
    if (er) return cb(null, []) // wtf? exclude file.
    if (r.indexOf(dir) === 0) return cb(null, file) // internal
    if (!isNM) return cb(null, []) // external non-dep
    // now the fun stuff!
    fs.realpath(df, function (er, resolved) {
      if (er) return cb(null, []) // can't add it.
      readJson(path.resolve(resolved, "package.json"), function (er) {
        if (er) return cb(null, []) // not a package
        resolveLinkDep(dir, file, resolved, target, pkg, function (er, f, c) {
          cb(er, f, c)
        })
      })
    })
  })
}

// put the link back the way it was.
function cleanupResolveLinkDep (cleanup, cb) {
  // cut it out of the list, so that cycles will be broken.
  if (!cleanup) return cb()

  asyncMap(cleanup, function (d, cb) {
    rm(d[1], function (er) {
      if (er) return cb(er)
      fs.symlink(d[0], d[1], cb)
    })
  }, cb)
}

function resolveLinkDep (dir, file, resolved, target, pkg, cb) {
  // we've already decided that this is a dep that will be bundled.
  // make sure the data reflects this.
  var bd = pkg.bundleDependencies || pkg.bundledDependencies || []
  delete pkg.bundledDependencies
  pkg.bundleDependencies = bd
  var f = path.resolve(dir, file)
    , cleanup = [[target, f, resolved]]

  if (bd.indexOf(file) === -1) {
    // then we don't do this one.
    // just move the symlink out of the way.
    return rm(f, function (er) {
      cb(er, file, cleanup)
    })
  }

  rm(f, function (er) {
    if (er) return cb(er)
    cache.add(resolved, function (er, data) {
      if (er) return cb(er)
      cache.unpack(data.name, data.version, f, function (er, data) {
        if (er) return cb(er)
        // now clear out the cache entry, since it's weird, probably.
        // pass the cleanup object along so that the thing getting the
        // list of files knows what to clean up afterwards.
        cache.clean([data._id], function (er) { cb(er, file, cleanup) })
      })
    })
  })
}

// exList is a list of ignore lists.
// Each exList item is an array of patterns of files to ignore
//
function makeList_ (dir, pkg, exList, dfc, cb) {
  var files = null
    , cleanup = null

  readDir(dir, pkg, dfc, function (er, f, c) {
    if (er) return cb(er)
    cleanup = c
    files = f.map(function (f) {
      // no nulls in paths!
      return f.split(/\0/)[0]
    }).filter(function (f) {
      // always remove all source control folders and
      // waf/vim/OSX garbage.  this is a firm requirement.
      return !( f === ".git/"
             || f === ".lock-wscript"
             || f === "CVS/"
             || f === ".svn/"
             || f === ".hg/"
             || f.match(/^\..*\.swp/)
             || f === ".DS_Store"
             || f.match(/^\._/)
             || f === "npm-debug.log"
             || f === ""
             || f.charAt(0) === "/"
              )
    })

    if (files.indexOf("package.json") !== -1 && dir !== pkg.path) {
      // a package.json file starts the whole exclude/include
      // logic all over.  Otherwise, a parent could break its
      // deps with its files list or .npmignore file.
      readJson(path.resolve(dir, "package.json"), function (er, data) {
        if (!er && typeof data === "object") {
          data.path = dir
          return makeList(dir, data, dfc, function (er, files) {
            // these need to be mounted onto the directory now.
            cb(er, files && files.map(function (f) {
              return path.resolve(path.dirname(dir), f)
            }))
          })
        }
        next()
      })
      //next()
    } else next()

    // add a local ignore file, if found.
    if (files.indexOf(".npmignore") === -1
        && files.indexOf(".gitignore") === -1) next()
    else {
      excludes.addIgnoreFile( path.resolve(dir, ".npmignore")
                            , ".gitignore"
                            , exList
                            , dir
                            , function (er, list) {
        if (!er) exList = list
        next(er)
      })
    }
  })

  var n = 2
    , errState = null
  function next (er) {
    if (errState) return
    if (er) return cb(errState = er, [], cleanup)
    if (-- n > 0) return

    if (!pkg) return cb(new Error("No package.json file in "+dir))
    if (pkg.path === dir && pkg.files) {
      pkg.files = pkg.files.filter(function (f) {
        f = f.trim()
        return f && f.charAt(0) !== "#"
      })
      if (!pkg.files.length) pkg.files = null
    }
    if (pkg.path === dir && pkg.files) {
      // stuff on the files list MUST be there.
      // ignore everything, then include the stuff on the files list.
      var pkgFiles = ["*"].concat(pkg.files.map(function (f) {
        return "!" + f
      }))
      pkgFiles.dir = dir
      pkgFiles.packageFiles = true
      exList.push(pkgFiles)
    }

    if (path.basename(dir) === "node_modules"
        && pkg.path === path.dirname(dir)
        && dfc) { // do fancy crap
      files = filterNodeModules(files, pkg)
    } else {
      // If a directory is excluded, we still need to be
      // able to *include* a file within it, and have that override
      // the prior exclusion.
      //
      // This whole makeList thing probably needs to be rewritten
      files = files.filter(function (f) {
        return excludes.filter(dir, exList)(f) || f.slice(-1) === "/"
      })
    }


    asyncMap(files, function (file, cb) {
      // if this is a dir, then dive into it.
      // otherwise, don't.
      file = path.resolve(dir, file)

      // in 0.6.0, fs.readdir can produce some really odd results.
      // XXX: remove this and make the engines hash exclude 0.6.0
      if (file.indexOf(dir) !== 0) {
        return cb(null, [])
      }

      fs.lstat(file, function (er, st) {
        if (er) return cb(er)
        if (st.isDirectory()) {
          return makeList_(file, pkg, exList, dfc, cb)
        }
        return cb(null, file)
      })
    }, function (er, files, c) {
      if (c) cleanup = (cleanup || []).concat(c)
      return cb(er, files, cleanup)
    })
  }
}

// only include node_modules folder that are:
// 1. not on the dependencies list or
// 2. on the "bundleDependencies" list.
function filterNodeModules (files, pkg) {
  var bd = pkg.bundleDependencies || pkg.bundledDependencies || []
    , deps = Object.keys(pkg.dependencies || {})
             .filter(function (key) { return !pkg.dependencies[key].extraneous })
             .concat(Object.keys(pkg.devDependencies || {}))

  delete pkg.bundledDependencies
  pkg.bundleDependencies = bd

  return files.filter(function (f) {
    f = f.replace(/\/$/, "")
    return f.charAt(0) !== "."
           && f.charAt(0) !== "_"
           && bd.indexOf(f) !== -1
  })
}

if (require.main === module) npm.load(function () {
  //npm.config.set("tar", "tar")
  //npm.config.set("cache", path.resolve(process.env.HOME, ".npm"))
  //npm.config.set("tmp", "/tmp")
  //npm.commands.config(["ls"], function () {})
  makeList(process.cwd(), function (er, list, cleanup) {
    console.error("list", list)
    cleanupResolveLinkDep(cleanup, function (er2) {
      if (er || er2) {
        if (er) log.info(er, "packing tarball")
        if (er2) log.info(er2, "while cleaning up resolved deps")
      }
      console.error("ok!")
    })
  })
})
