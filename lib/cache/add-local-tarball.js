var mkdir = require("mkdirp")
  , assert = require("assert")
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
  , chownr = require("chownr")
  , inflight = require("inflight")

module.exports = addLocalTarball

function addLocalTarball (p, pkgData, shasum, cb_) {
  assert(typeof p === "string", "must have path")
  assert(typeof cb_ === "function", "must have callback")

  if (!pkgData) pkgData = {}
  var name = pkgData.name || ""
  var version = pkgData.version || ""

  // If we don't have a shasum yet, then get the shasum now.
  if (!shasum) {
    return sha.get(p, function (er, shasum) {
      if (er) return cb_(er)
      addLocalTarball(p, pkgData, shasum, cb_)
    })
  }

  // if it's a tar, and not in place,
  // then unzip to .tmp, add the tmp folder, and clean up tmp
  if (pathIsInside(p, npm.tmp))
    return addTmpTarball(p, pkgData, shasum, cb_)

  if (pathIsInside(p, npm.cache)) {
    if (path.basename(p) !== "package.tgz") return cb_(new Error(
      "Not a valid cache tarball name: "+p))
    return addPlacedTarball(p, pkgData, shasum, cb_)
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

function addPlacedTarball (p, pkgData, shasum, cb) {
  assert(pkgData, "should have package data by now")
  assert(typeof cb === "function", "cb function required")

  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    return addPlacedTarball_(p, pkgData, cs.uid, cs.gid, shasum, cb)
  })
}

// resolvedSum is the shasum from the registry dist object, but *not*
// necessarily the shasum of this tarball, because for stupid historical
// reasons, npm re-packs each package an extra time through a temp directory,
// so all installed packages are actually built with *this* version of npm, on
// this machine.
//
// Once upon a time, this meant that we could change package formats around and
// fix junk that might be added by incompatible tar implementations. Then, for
// a while, it was a way to correct bs added by bugs in our own tar
// implementation. Now, it's just garbage, but cleaning it up is a pain, and
// likely to cause issues if anything is overlooked, so it's not high priority.
//
// If you're bored, and looking to make npm go faster, and you've already made
// it this far in this file, here's a better methodology:
//
// cache.add should really be cache.place.  That is, it should take a set of
// arguments like it does now, but then also a destination folder.
//
// cache.add('foo@bar', '/path/node_modules/foo', false, cb)
//
// 1. Resolve 'foo@bar' to some specific:
//   - git url
//   - local folder
//   - local tarball
//   - tarball url
// 2. If resolved through the registry, then pick up the dist.shasum
//    along the way.
// 3. Acquire request() stream fetching bytes: FETCH
// 4. FETCH.pipe(tar unpack stream to dest)
// 5. FETCH.pipe(shasum generator)
//    When the tar and shasum streams both finish, make sure that the shasum
//    matches dist.shasum, and if not, clean up and bail.

function addPlacedTarball_ (p, pkgData, uid, gid, resolvedSum, cb) {
  // now we know it's in place already as .cache/name/ver/package.tgz
  // unpack to .cache/name/ver/package/, read the package.json,
  // and fire cb with the json data.
  var name = pkgData.name
    , version = pkgData.version
    , folder = path.join(npm.cache, name, version, "package")

  // First, make sure we have the shasum, if we don't already.
  if (!resolvedSum) {
    sha.get(p, function (er, shasum) {
      if (er) return cb(er)
      addPlacedTarball_(p, pkgData, uid, gid, shasum, cb)
    })
    return
  }

  lock(folder, function (er) {
    if (er) return cb(er)

    cb = function (c) { return function (er, data) {
      unlock(folder, function (er2) {
        return c(er || er2, data)
      })
    }}(cb)

    mkdir(folder, function (er) {
      if (er) return cb(er)
      var pj = path.join(folder, "package.json")
      var json = JSON.stringify(pkgData, null, 2)
      fs.writeFile(pj, json, "utf8", function (er) {
        cb(er, pkgData)
      })
    })
  })
}

function addTmpTarball (tgz, pkgData, shasum, cb) {
  assert(typeof cb === "function", "must have callback function")

  cb = inflight("addTmpTarball:" + tgz, cb)
  if (!cb) return

  if (!shasum) {
    return sha.get(tgz, function (er, shasum) {
      if (er) return cb(er)
      addTmpTarball(tgz, pkgData, shasum, cb)
    })
  }

  if (pkgData && pkgData.name && pkgData.version) {
    return addTmpTarball_(tgz, pkgData, shasum, cb)
  }

  // This is a tarball we probably downloaded from the internet.
  // The shasum's already been checked, but we haven't ever had
  // a peek inside, so we unpack it here just to make sure it is
  // what it says it is.
  // Note: we might not have any clue what we think it is, for
  // example if the user just did `npm install ./foo.tgz`

  var dir = path.dirname(tgz)
  var target = tgz + "-unpack"
  getCacheStat(function (er, cs) {
    tar.unpack(tgz, target, null, null, cs.uid, cs.gid, next)
  })

  function next (er) {
    if (er) return cb(er)
    var pj = path.join(target, "package.json")
    readJson(pj, function (er, data) {
      // XXX dry with similar stanza in add-local.js
      er = needName(er, data)
      er = needVersion(er, data)
      // check that this is what we expected.
      if (!er && pkgData.name && pkgData.name !== data.name) {
        er = new Error( "Invalid Package: expected "
                      + pkgData.name + " but found "
                      + data.name )
      }

      if (!er && pkgData.version && pkgData.version !== data.version) {
        er = new Error( "Invalid Package: expected "
                      + pkgData.name + "@" + pkgData.version
                      + " but found "
                      + data.name + "@" + data.version )
      }

      if (er) return cb(er)

      addTmpTarball_(tgz, data, shasum, cb)
    })
  }
}

function addTmpTarball_ (tgz, data, shasum, cb) {
  assert(typeof cb === "function", "must have callback function")

  var name = data.name
  var version = data.version
  assert(name, "should have package name by now")
  assert(version, "should have package version by now")

  var root = path.resolve(npm.cache, name, version)
  var pkg = path.resolve(root, "package")
  var target = path.resolve(root, "package.tgz")
  getCacheStat(function (er, cs) {
    if (er) return cb(er)
    mkdir(pkg, function (er) {
      if (er) return cb(er)
      var read = fs.createReadStream(tgz)
      var write = fs.createWriteStream(target)
      var fin = cs.uid && cs.gid ? chown : done
      read.on("error", cb).pipe(write).on("error", cb).on("close", fin)
    })

    function chown () {
      chownr(root, cs.uid, cs.gid, done)
    }
  })

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
