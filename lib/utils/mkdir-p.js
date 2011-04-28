
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

  if (mode & umask) {
    log.verbose(mode.toString(8), "umasking from "+umask.toString(8))
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

  if (uid === null && gid === null) {
    return mkdir_(ensure, mode, uid, gid, cb)
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
  log.verbose("done: "+ensure+" "+mode.toString(8), "mkdir")
  fs.chmod(ensure, mode, function (er) {
    if (er || ensure === npm.dir || uid == null
        || npm.config.get("unsafe-perm")) return cb(er)
    if (typeof uid !== "number" || typeof gid !== "number") {
      return cb(er)
    }
    uid = Math.floor(uid)
    gid = Math.floor(gid)
    fs.chown(ensure, uid, gid, cb)
  })
}

function walkDirs (ensure, mode, uid, gid, cb) {
  var dirs = ensure.split("/")
    , walker = []
    , foundUID = null
    , foundGID = null
  walker.push(dirs.shift()) // gobble the "/" first
  ;(function S (d) {
    if (d === undefined) {
      return done(ensure, mode, uid, gid, cb)
    }
    walker.push(d)
    var dir = walker.join("/")
    fs.stat(dir, function STATCB (er, s) {
      if (er) {
        if (foundUID !== null) uid = foundUID
        if (foundGID !== null) gid = foundGID
        fs.mkdir(dir, mode, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // handle stat race
            return fs.stat(dir, STATCB)
          }
          if (er) return cb(er)
          if (uid && gid && !npm.config.get("unsafe-perm")) {
            fs.chown(dir, uid, gid, function (er) {
              S(dirs.shift())
            })
          } else {
            S(dirs.shift())
          }
        })
      } else {
        if (s.isDirectory()) {
          if (uid === null && typeof s.uid === "number") foundUID = s.uid
          if (gid === null && typeof s.gid === "number") foundGID = s.gid
          S(dirs.shift())
        } else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}
