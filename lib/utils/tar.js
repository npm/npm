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

exports.pack = pack
exports.unpack = unpack

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
    , ignore = path.resolve(folder, ".npmignore")
    , defaultIgnore = path.resolve(__dirname, "default.npmignore")
    , customIgnore = false

  cb = log.er(cb, "Failed creating the tarball.")

  fs.stat(ignore, function (er) {
    if (er) ignore = defaultIgnore
    else customIgnore = true
    log.verbose(customIgnore, "has custom ignore file")
    mkdir(path.dirname(targetTarball), function (er) {
      if (er) return log.er(cb, "Could not create "+targetTarball)(er)
      log.verbose(path.dirname(targetTarball), "mkdir'ed")
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
      if (!pkg.files) pkg.files = [""]
      args.push.apply(args, pkg.files.map(function (f) {
        // the second path.join is to prevent escapes.
        return path.join(addFolder, path.join("/", f))
      }))
      log.verbose(args, "args")
      var tar = spawn(npm.config.get("tar"), args, tarEnv, false, parent)
        , gzip = spawn( npm.config.get("gzipbin"), ["--stdout"]
                      , null, false, parent )
        , errState
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

