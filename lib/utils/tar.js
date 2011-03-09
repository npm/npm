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
  , minimatch = require("./minimatch")
  , relativize = require("./relativize")

exports.pack = pack
exports.unpack = unpack
exports.makeList = makeList

function pack (targetTarball, folder, pkg, cb) {
  if (folder.charAt(0) !== "/") folder = path.resolve(process.cwd(), folder)
  if (folder.slice(-1) === "/") folder = folder.slice(0, -1)
  if (typeof pkg === "function") {
    cb = pkg, pkg = null
    return readJson(path.resolve(folder, "package.json"), function (er, pkg) {
      if (er) return log.er(cb, "Couldn't find package.json in "+folder)(er)
      pack(targetTarball, folder, pkg, cb)
    })
  }
  log.verbose(folder+" "+targetTarball, "pack")
  var parent = path.dirname(folder)
    , addFolder = path.basename(folder)

  cb = log.er(cb, "Failed creating the tarball.")

  var confEx = npm.config.get("ignore")
  makeList(folder, pkg, function (er, files) {
    if (er) return cb(er)
    return packFiles(targetTarball, parent, files, pkg, cb)
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
    log.silly(args, "args")
    var tar = spawn(npm.config.get("tar"), args, tarEnv, false, parent)
      , gzip = spawn( npm.config.get("gzipbin"), ["--stdout"]
                    , null, false, parent )
      , errState
    tar.name = "tar -cvf - <file list elided>"
    pipe(tar, gzip, function (er) {
      if (errState) return
      if (er) return cb(errState = er)
    })
    gzip.stdout.pipe(target)
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
    gunzTarPerm(tarball, tmp, dMode, fMode, uid, gid, function (er, folder) {
      log.verbose(folder, "gunzed")
      rm(unpackTarget, function (er) {
        if (er) return cb(er)
        log.verbose(unpackTarget, "rm'ed")
        fs.rename(folder, unpackTarget, function (er) {
          if (er) return cb(er)
          log.verbose([folder, unpackTarget], "renamed")
          rm(tmp, function (er) {
            if (er) return cb(er)
            log.verbose(tmp, "rm'ed")
            readJson(path.resolve(unpackTarget, "package.json"), cb)
          })
        })
      })
    })
  })
}

function gunzTarPerm (tarball, tmp, dMode, fMode, uid, gid, cb) {
  pipe( spawn( npm.config.get("gzipbin")
             , ["--decompress", "--stdout", tarball]
             , process.env, false )
      , spawn( npm.config.get("tar")
             , ["-mvxpf", "-", "-C", tmp]
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
          find(tmp, function (f) {
            return f !== tmp
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
              fs.chown(tmp, process.getuid(), process.getgid()
                      ,function (er) {
                if (er) return cb(er)
                fs.readdir(tmp, function (er, folder) {
                  cb(er, folder && path.resolve(tmp, folder[0]))
                })
              })
            })
          })
        }
      )
}

function makeList (dir, pkg, excludes, cb) {
  if (typeof cb !== "function") cb = excludes, excludes = []
  if (typeof cb !== "function") cb = pkg, pkg = null
  dir = path.resolve(dir)
  var name = path.basename(dir)

  makeList_(dir, pkg, excludes, function (er, files) {
    if (er) return cb(er)
    var dirLen = dir.length + 1
    return cb(null, files.map(function (file) {
      return path.join(name, file.substr(dirLen))
    }))
  })
}

// Patterns ending in slashes will only match targets
// ending in slashes.  To implement this, add a / to
// the filename iff it lstats isDirectory()
function readDir (dir, cb) {
  fs.readdir(dir, function (er, files) {
    if (er) return cb(er)
    asyncMap(files, function (file, cb) {
      fs.lstat(path.resolve(dir, file), function (er, st) {
        if (er) return cb(null, [])
        return cb(null, file + (st.isDirectory() ? "/" : ""))
      })
    }, cb)
  })
}

function makeList_ (dir, pkg, excludes, cb) {

  var files = null
  readDir(dir, function (er, f) {
    files = f.filter(function (f) {
      // always remove all source control folders and
      // waf's garbage.  this is a firm requirement.
      return !( f === ".git/"
             || f === ".lock-wscript"
             || f === "CVS/"
             || f === ".svn/"
             || f === ".hg/"
              )
    })
    if (files.indexOf("package.json") !== -1) {
      readJson(path.resolve(dir, "package.json"), function (er, data) {
        if (!er && typeof data === "object") {
          pkg = data
          pkg.path = dir
        }
        next()
      })
    } else next()

    var ignoreFile
    if (files.indexOf(".npmignore") !== -1) {
      ignoreFile = ".npmignore"
    } else if (files.indexOf(".gitignore") !== -1) {
      ignoreFile = ".gitignore"
    }
    if (ignoreFile) {
      fs.readFile(path.resolve(dir, ignoreFile), function (er, ignore) {
        if (er) return cb(er)
        ignore = ignore.toString("utf8").split(/\n/).map(function (p) {
          return p.trim()
        }).filter(function (p) {
          return p.length && p.trim().charAt(0) !== "#"
        })
        excludes = ignore
        // excludes are relative to the file.
        excludes.dir = dir
        next()
      })
    } else next()
  })

  var n = 2
    , errState = null
  function next (er) {
    if (errState) return
    if (er) return cb(errState = er)
    if (-- n > 0) return

    // if nothing is explicitly excluded, then exclude the
    // build/ dir. Note that this is *overridden* if "build/"
    // is in the package.json "files" array.
    if (!excludes) {
      excludes = ["build/"]
      excludes.dir = dir
    }

    if (!pkg) return cb(new Error("No package.json file in "+dir))
    if (pkg.path === dir) {
      // a package.json starts a new npmignore world.
      // otherwise a parent package could break its nested bundles.
      if (excludes.dir !== pkg.path) {
        excludes = ["build/"]
        excludes.dir = dir
      }
      var pkgFiles = pkg.files ? pkg.files.map(function (f) {
        return "!" + f
      }) : []
      excludes.push.apply(excludes, pkgFiles)
      files = filter(dir, files, pkgFiles, pkg.path)
    }

    if (path.basename(dir) === "node_modules"
        && pkg.path === path.dirname(dir)) {
      files = filterNodeModules(files, pkg)
    } else files = filter(dir, files, excludes, excludes.dir)

    // empty folders get added to the list,
    // but other files will be added by tar implicitly.
    if (!files.length) {
      return cb(null, [dir])
    }

    asyncMap(files, function (file, cb) {
      // if this is a dir, then dive into it.
      // otherwise, don't.
      file = path.resolve(dir, file)
      fs.lstat(file, function (er, st) {
        if (er) return cb(er)
        if (st.isDirectory()) {
          return makeList_(file, pkg, excludes, cb)
        }
        return cb(null, file)
      })
    }, cb)
  }
}

// filter out the files in dir
// by applying the excludes relative to excludeDir
function filter (dir, files, excludes, excludeDir) {
  // NB: any negated-pattern that matches will cause
  // the file to be re-included, even if it would have
  // been excluded by a previous or future pattern.
  //
  // Patterns are resolved relative to the directory that
  // the pattern sits in.

  // chop the dir down to be relative to excludeDir
  var stem = relativize(dir, excludeDir)
  return files.filter(function (file) {
    file = path.join(stem, file)
    var excluded = false
      , incRe = /^\!(\!\!)*/
    for (var i = 0, l = excludes.length; i < l; i ++) {
      var ex = excludes[i]
        , inc = ex.match(incRe)
      if (excluded && !inc) continue
      excluded = minimatch(file, "!" + ex)
      if (inc && !excluded) break
    }
    return !excluded
  })
}

// only include node_modules folder that are:
// 1. not on the dependencies list or
// 2. on the "bundleDependencies" list.
function filterNodeModules (files, pkg) {
  var bd = pkg.bundleDependencies || pkg.bundledDependencies || []
    , deps = Object.keys(pkg.dependencies || {})
             .concat(Object.keys(pkg.devDependencies || {}))
  console.error("filterNodeModules %j %j %j", files, deps, bd)
  return files.filter(function (f) {
    f = f.replace(/\/$/, "")
    return f !== ".bin"
         && (deps.indexOf(f) === -1 || bd.indexOf(f) !== -1)
  })
}

if (require.main === module) {
  var TESTING = true
  makeList(process.cwd(), function (er, list) {
    if (er) throw er
    console.log(list.join("\n"))
  })
}

