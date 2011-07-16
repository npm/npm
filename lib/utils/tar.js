// commands for packing and unpacking tarballs
// this file is used by lib/cache.js

var FMODE = exports.FMODE = 0644
  , DMODE = exports.DMODE = 0755
  , npm = require("../../npm")
  , fs = require("./graceful-fs")
  , exec = require("./exec")
  , spawn = exec.spawn
  , pipe = exec.pipe
  , find = require("./find")
  , mkdir = require("./mkdir-p")
  , asyncMap = require("./async-map")
  , path = require("path")
  , log = require("./log")
  , uidNumber = require("./uid-number")
  , rm = require("./rm-rf")
  , readJson = require("./read-json")
  , relativize = require("./relativize")
  , cache = require("../cache")
  , excludes = require("./excludes")

exports.pack = pack
exports.unpack = unpack
exports.makeList = makeList


function pack (targetTarball, folder, pkg, dfc, cb) {
  if (typeof cb !== "function") cb = dfc, dfc = true
  if (folder.charAt(0) !== "/") folder = path.resolve(process.cwd(), folder)
  if (folder.slice(-1) === "/") folder = folder.slice(0, -1)
  if (typeof pkg === "function") {
    cb = pkg, pkg = null
    return readJson(path.resolve(folder, "package.json"), function (er, pkg) {
      if (er) return log.er(cb, "Couldn't find package.json in "+folder)(er)
      pack(targetTarball, folder, pkg, dfc, cb)
    })
  }
  log.verbose(folder+" "+targetTarball, "pack")
  var parent = path.dirname(folder)
    , addFolder = path.basename(folder)

  cb = log.er(cb, "Failed creating the tarball.")

  var confEx = npm.config.get("ignore")
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
    var target = fs.createWriteStream(targetTarball)
      , unPacked = false
      , args = [ "-cvf", "-"].concat(files)
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
                   , args, tarEnv, false, parent )
      , gzip = spawn( npm.config.get("gzipbin")
                    , ["--stdout"] , null, false, parent )
      , errState
    tar.name = "tar -cvf - <file list elided>"
    pipe(tar, gzip, function (er) {
      //clearTimeout(gzipTimeout)
      if (errState) return
      if (er) return cb(errState = er)
    })
    gzip.stdout.pipe(target)
    //var gzipTimeout = setTimeout(function () {
    //  gzip.kill("SIGKILL")
    //  gzip.emit("error", new Error("gzip timeout"))
    //}, 10000)
    target.on("close", function (er, ok) {
      if (errState) return
      if (er) return cb(errState = er)
      fs.chmod(targetTarball, 0644, function (er) {
        if (errState) return
        return cb(errState = er)
      })
    })
  })
}


function unpack (tarball, unpackTarget, dMode, fMode, uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = fMode, fMode = FMODE
  if (typeof cb !== "function") cb = dMode, dMode = DMODE

  uidNumber(uid, gid, function (er, uid, gid) {
    if (er) return cb(er)
    unpack_(tarball, unpackTarget, dMode, fMode, uid, gid, cb)
  })
}

function unpack_ ( tarball, unpackTarget, dMode, fMode, uid, gid, cb ) {
  // If the desired target is /path/to/foo,
  // then unpack into /path/to/.foo.npm/{something}
  // rename that to /path/to/foo, and delete /path/to/.foo.npm
  var parent = path.dirname(unpackTarget)
    , base = path.basename(unpackTarget)
    , tmp = path.resolve(parent, "___" + base + ".npm")

  mkdir(tmp, dMode || DMODE, uid, gid, function (er) {
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
  if (!dMode) dMode = DMODE
  if (!fMode) fMode = FMODE
  log.silly([dMode.toString(8), fMode.toString(8)], "gunzTarPerm modes")
  //console.error(npm.config.get("gzipbin")+" --decompress --stdout "
  //  +tarball+" | "+npm.config.get("tar")+" -mvxpf - -o -C "
  //  +tmp)
  pipe( spawn( npm.config.get("gzipbin")
             , ["--decompress", "--stdout", tarball]
             , process.env, false )
      , spawn( npm.config.get("tar")
             , ["-mvxpf", "-", "-o", "-C", tmp]
             , process.env, false )
      , function (er) {
          // if we're not doing ownership management,
          // then we're done now.
          if (er) return log.er(cb,
            "Failed unpacking "+tarball)(er)
          if (npm.config.get("unsafe-perm")) {
            if (!process.getuid || !process.getgid) return cb(er)
            uid = process.getuid()
            gid = process.getgid()
            if (uid === 0) {
              if (process.env.SUDO_UID) uid = +process.env.SUDO_UID
              if (process.env.SUDO_GID) gid = +process.env.SUDO_GID
            }
          }
          find(tmp, function (f) {
            return f !== tmp
          }, function (er, files) {
            if (er) return cb(er)
            asyncMap(files, function (f, cb) {
              log.silly(f, "asyncMap in gTP")
              fs.lstat(f, function (er, stat) {
                if (er || stat.isSymbolicLink()) return cb(er)
                fs.chown(f, uid, gid, function (er) {
                  if (er) return cb(er)
                  var mode = stat.isDirectory() ? dMode : fMode
                    , oldMode = stat.mode & 0777
                    , newMode = (oldMode | mode) & (~(process.umask() || 022))
                  if (mode && newMode !== oldMode) {
                    log.silly(newMode.toString(8), "chmod "+path.basename(f))
                    fs.chmod(f, newMode, cb)
                  } else cb()
                })
              })
            }, function (er) {
              if (er) return cb(er)
              fs.chown(tmp, process.getuid(), process.getgid()
                      ,function (er) {
                if (er) return cb(er)
                fs.readdir(tmp, function (er, folder) {
                  folder = folder.filter(function (f) {
                    return !f.match(/^\._/)
                  })
                  cb(er, folder && path.resolve(tmp, folder[0]))
                })
              })
            })
          })
        }
      )
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
    files = f.filter(function (f) {
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
      fs.lstat(file, function (er, st) {
        if (er) return cb(er)
        if (st.isDirectory()) {
          return makeList_(file, pkg, exList, dfc, cb)
        }
        return cb(null, file)
      })
    }, function (er, files, c) {
      //log.warn(files, "files")
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
  //npm.config.set("gzipbin", "gzip")
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
