
var log = require("./log")
  , fs = require("./graceful-fs")
  , path = require("path")
  , npm = require("../../npm")
  , exec = require("./exec")
  , uidNumber = require("./uid-number")
  , umask = process.umask()
  , umaskOrig = umask
  , addedUmaskExit = false
  , mkdirCache = {}

module.exports = mkdir
function mkdir (ensure, mode, uid, gid, cb_) {
  if (typeof cb_ !== "function") cb_ = gid, gid = null
  if (typeof cb_ !== "function") cb_ = uid, uid = null
  if (typeof cb_ !== "function") cb_ = mode, mode = 0755

  if (mode & umask !== mode) {
    process.umask(umask = 0)
    if (!addedUmaskExit) {
      addedUmaskExit = true
      process.on("exit", function () { process.umask(umask = umaskOrig) })
    }
  }

  ensure = ensure.replace(/\/+$/, '')
  if (ensure.charAt(0) !== "/") ensure = path.join(process.cwd(), ensure)

  if (mkdirCache.hasOwnProperty(ensure)) {
    return mkdirCache[ensure].push(cb_)
  }
  mkdirCache[ensure] = [cb_]

  function cb (er) {
    var cbs = mkdirCache[ensure]
    delete mkdirCache[ensure]
    cbs.forEach(function (c) { c(er) })
  }

  uidNumber(uid, gid, function (er, uid, gid) {
    if (er) return cb(er)
    mkdir_(ensure, mode, uid, gid, cb)
  })
}

function mkdir_ (ensure, mode, uid, gid, cb) {
  // if it's already a dir, then just check the bits and owner.
  fs.stat(ensure, function (er, s) {
    if (s && s.isDirectory()) {
      // check mode
      if ((s.mode & mode) === mode) return cb()
      return done(ensure, mode, uid, gid, cb)
    }
    return walkDirs(ensure, mode, uid, gid, cb)
  })
}
function done (ensure, mode, uid, gid, cb) {
  // now the directory has been created.
  // chown it to the desired uid/gid
  // Don't chown the npm.root dir, though, in case we're
  // in unsafe-perm mode.
  log.verbose("done: "+ensure, "mkdir")
  fs.chmod(ensure, mode, function (er) {
    if (er || ensure === npm.root || uid == null) return cb(er)
    fs.chown(ensure, uid, gid, cb)
  })
}
function walkDirs (ensure, mode, uid, gid, cb) {
  var dirs = ensure.split("/")
    , walker = []
  walker.push(dirs.shift()) // gobble the "/" first
  ;(function S (d) {
    if (d === undefined) {
      return done(ensure, mode, uid, gid, cb)
    }
    walker.push(d)
    var dir = walker.join("/")
    fs.stat(dir, function STATCB (er, s) {
      if (er) {
        fs.mkdir(dir, mode, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // handle stat race
            return fs.stat(dir, STATCB)
          }
          if (er) return cb(er)
          S(dirs.shift())
        })
      } else {
        if (s.isDirectory()) S(dirs.shift())
        else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}
