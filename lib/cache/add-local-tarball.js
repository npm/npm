'use strict';

var mkdir = require("mkdirp")
  , fs = require("graceful-fs")
  , readJson = require("read-package-json")
  , log = require("npmlog")
  , path = require("path")
  , crypto = require("crypto")
  , once = require("once")
  , sha = require("sha")
  , asyncMap = require("slide").asyncMap
  , npm = require("../npm.js")
  , tar = require("../utils/tar.js")
  , pathIsInside = require("path-is-inside")
  , rm = require("../utils/gently-rm.js")
  , deprCheck = require("../utils/depr-check.js")
  , locker = require("../utils/locker.js")
  , lock = locker.lock
  , unlock = locker.unlock
  , getCacheStat = require("./get-stat.js")

module.exports = function addLocalTarball (p, name, version, shasum, cb_) {
  if (typeof cb_ !== "function") cb_ = shasum, shasum = null
  if (typeof cb_ !== "function") cb_ = version, version = ""
  if (typeof cb_ !== "function") cb_ = name, name = ""

  // If we don't have a shasum yet, then get the shasum now.
  if (!shasum) {
    return sha.get(p, function (er, shasum) {
      if (er) return cb_(er)
      addLocalTarball(p, name, version, shasum, cb_)
    })
  }

  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  if (pathIsInside(p, npm.tmp))
    return addTmpTarball(p, name, version, shasum, cb_)

  if (pathIsInside(p, npm.cache)) {
    if (path.basename(p) !== "package.tgz") return cb_(new Error(
      "Not a valid cache tarball name: "+p))
    return addPlacedTarball(p, name, shasum, cb_)
  }

  function cb (er, data) {
    if (data) {
      data._resolved = p
      data._shasum = data._shasum || shasum
    }
    return cb_(er, data)
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
      log.verbose("chmod", tmp, npm.modes.file.toString(8))
      fs.chmod(tmp, npm.modes.file, function (er) {
        if (er) return cb(er)
        addTmpTarball(tmp, name, null, shasum, cb)
      })
    })
    from.pipe(to)
  })
}

function addPlacedTarball (p, name, shasum, cb) {
  if (!cb) cb = name, name = ""
  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    return addPlacedTarball_(p, name, cs.uid, cs.gid, shasum, cb)
  })
}

// Resolved sum is the shasum from the registry dist object, but
// *not* necessarily the shasum of this tarball, because for stupid
// historical reasons, npm re-packs each package an extra time through
// a temp directory, so all installed packages are actually built with
// *this* version of npm, on this machine.
//
// Once upon a time, this meant that we could change package formats
// around and fix junk that might be added by incompatible tar
// implementations.  Then, for a while, it was a way to correct bs
// added by bugs in our own tar implementation.  Now, it's just
// garbage, but cleaning it up is a pain, and likely to cause issues
// if anything is overlooked, so it's not high priority.
//
// If you're bored, and looking to make npm go faster, and you've
// already made it this far in this file, here's a better methodology:
//
// cache.add should really be cache.place.  That is, it should take
// a set of arguments like it does now, but then also a destination
// folder.
//
// cache.add('foo@bar', '/path/node_modules/foo', cb)
//
// 1. Resolve 'foo@bar' to some specific:
//   - git url
//   - local folder
//   - local tarball
//   - tarball url
// 2. If resolved through the registry, then pick up the dist.shasum
// along the way.
// 3. Acquire request() stream fetching bytes: FETCH
// 4. FETCH.pipe(tar unpack stream to dest)
// 5. FETCH.pipe(shasum generator)
// When the tar and shasum streams both finish, make sure that the
// shasum matches dist.shasum, and if not, clean up and bail.
//
// publish(cb)
//
// 1. read package.json
// 2. get root package object (for rev, and versions)
// 3. update root package doc with version info
// 4. remove _attachments object
// 5. remove versions object
// 5. jsonify, remove last }
// 6. get stream: registry.put(/package)
// 7. write trailing-}-less JSON
// 8. write "_attachments":
// 9. JSON.stringify(attachments), remove trailing }
// 10. Write start of attachments (stubs)
// 11. JSON(filename)+':{"type":"application/octet-stream","data":"'
// 12. acquire tar packing stream, PACK
// 13. PACK.pipe(PUT)
// 14. PACK.pipe(shasum generator)
// 15. when PACK finishes, get shasum
// 16. PUT.write('"}},') (finish _attachments
// 17. update "versions" object with current package version
// (including dist.shasum and dist.tarball)
// 18. write '"versions":' + JSON(versions)
// 19. write '}}' (versions, close main doc)

function addPlacedTarball_ (p, name, uid, gid, resolvedSum, cb) {
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var target = path.dirname(p)
    , folder = path.join(target, "package")

  lock(folder, function (er) {
    if (er) return cb(er)
    rmUnpack()
  })

  function rmUnpack () {
    rm(folder, function (er) {
      unlock(folder, function () {
        if (er) {
          log.error("addPlacedTarball", "Could not remove %j", folder)
          return cb(er)
        }
        thenUnpack()
      })
    })
  }

  function thenUnpack () {
    tar.unpack(p, folder, null, null, uid, gid, function (er) {
      if (er) {
        log.error("addPlacedTarball", "Could not unpack %j to %j", p, target)
        return cb(er)
      }
      // calculate the sha of the file that we just unpacked.
      // this is so that the data is available when publishing.
      sha.get(p, function (er, shasum) {
        if (er) {
          log.error("addPlacedTarball", "shasum fail", p)
          return cb(er)
        }
        readJson(path.join(folder, "package.json"), function (er, data) {
          er = needName(er, data)
          er = needVersion(er, data)
          if (er) {
            log.error("addPlacedTarball", "Couldn't read json in %j"
                     , folder)
            return cb(er)
          }

          data.dist = data.dist || {}
          data.dist.shasum = shasum
          deprCheck(data)
          asyncMap([p], function (f, cb) {
            log.verbose("chmod", f, npm.modes.file.toString(8))
            fs.chmod(f, npm.modes.file, cb)
          }, function (f, cb) {
            if (process.platform === "win32") {
              log.silly("chown", "skipping for windows", f)
              cb()
            } else if (typeof uid === "number"
                && typeof gid === "number"
                && parseInt(uid, 10) === uid
                && parseInt(gid, 10) === gid) {
              log.verbose("chown", f, [uid, gid])
              fs.chown(f, uid, gid, cb)
            } else {
              log.verbose("chown", "skip for invalid uid/gid", [f, uid, gid])
              cb()
            }
          }, function (er) {
            cb(er, data)
          })
        })
      })
    })
  }
}

// XXX This is where it should be fixed
// Right now it's unpacking to a "package" folder, and then
// adding that local folder, for historical reasons.
// Instead, unpack to the *cache* folder, and then copy the
// tgz into place in the cache, so the shasum doesn't change.
function addTmpTarball (tgz, name, version, shasum, cb) {
  // Just have a placeholder here so we can move it into place after.
  var tmp = false
  if (!version) {
    tmp = true
    version = 'tmp_' + crypto.randomBytes(6).toString('hex')
  }
  if (!name) {
    tmp = true
    name = 'tmp_' + crypto.randomBytes(6).toString('hex')
  }
  var pdir
  if (!tmp) {
    pdir = path.resolve(npm.cache, name, version, "package")
  } else {
    pdir = path.resolve(npm.cache, name + version + "package")
  }

  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    tar.unpack(tgz, pdir, null, null, cs.uid, cs.gid, next)
  })

  function next (er) {
    if (er) return cb(er)
    // it MUST be able to get a version now!
    var pj = path.resolve(pdir, "package.json")
    readJson(pj, function (er, data) {
      if (er) return cb(er)
      if (version === data.version && name === data.name && !tmp) {
        addTmpTarball_(tgz, data, name, version, shasum, cb)
      } else {
        var old = pdir
        name = data.name
        version = data.version
        pdir = path.resolve(npm.cache, name, version, "package")
        mkdir(path.dirname(pdir), function(er) {
          if (er) return cb(er)
          rm(pdir, function(er) {
            if (er) return cb(er)
            fs.rename(old, pdir, function(er) {
              if (er) return cb(er)
              rm(old, function(er) {
                if (er) return cb(er)
                addTmpTarball_(tgz, data, name, version, shasum, cb)
              })
            })
          })
        })
      }
    })
  }
}

function addTmpTarball_ (tgz, data, name, version, shasum, cb) {
  cb = once(cb)
  var target = path.resolve(npm.cache, name, version, "package.tgz")
  var read = fs.createReadStream(tgz)
  var write = fs.createWriteStream(target)
  read.on("error", cb).pipe(write).on("error", cb).on("close", done)

  function done() {
    data._shasum = data._shasum || shasum
    cb(null, data)
  }
}

function needName(er, data) {
  return er ? er
       : (data && !data.name) ? new Error("No name provided")
       : null
}

function needVersion(er, data) {
  return er ? er
       : (data && !data.version) ? new Error("No version provided")
       : null
}
