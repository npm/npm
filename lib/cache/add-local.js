'use strict';

var fs = require("graceful-fs")
  , path = require("path")
  , mkdir = require("mkdirp")
  , chownr = require("chownr")
  , pathIsInside = require("path-is-inside")
  , readJson = require("read-package-json")
  , log = require("npmlog")
  , npm = require("../npm.js")
  , tar = require("../utils/tar.js")
  , deprCheck = require("../utils/depr-check.js")
  , locker = require("../utils/locker.js")
  , lock = locker.lock
  , unlock = locker.unlock
  , getCacheStat = require("./get-stat.js")
  , addNamed = require("./add-named.js")
  , addLocalTarball = require("./add-local-tarball.js")
  , maybeGithub = require("./maybe-github.js")

module.exports = function addLocal (p, name, inFlightURLs, cb_) {
  if (typeof cb_ !== "function") cb_ = name, name = ""

  function cb (er, data) {
    unlock(p, function () {
      if (er) {
        // if it doesn't have a / in it, it might be a
        // remote thing.
        if (p.indexOf("/") === -1 && p.charAt(0) !== "."
           && (process.platform !== "win32" || p.indexOf("\\") === -1)) {
          return addNamed(p, "", null, inFlightURLs, cb_)
        }
        log.error("addLocal", "Could not install %s", p)
        return cb_(er)
      }
      if (data && !data._fromGithub) data._from = p
      return cb_(er, data)
    })
  }

  lock(p, function (er) {
    if (er) return cb(er)
    // figure out if this is a folder or file.
    fs.stat(p, function (er, s) {
      if (er) {
        // might be username/project
        // in that case, try it as a github url.
        if (p.split("/").length === 2) {
          return maybeGithub(p, name, er, cb)
        }
        return cb(er)
      }
      if (s.isDirectory()) addLocalDirectory(p, name, cb)
      else addLocalTarball(p, name, cb)
    })
  })
}

// At this point, if shasum is set, it's something that we've already
// read and checked.  Just stashing it in the data at this point.
function addLocalDirectory (p, name, shasum, cb) {
  if (typeof cb !== "function") cb = shasum, shasum = ""
  if (typeof cb !== "function") cb = name, name = ""
  // if it's a folder, then read the package.json,
  // tar it to the proper place, and add the cache tar
  if (pathIsInside(p, npm.cache)) return cb(new Error(
    "Adding a cache directory to the cache will make the world implode."))
  readJson(path.join(p, "package.json"), false, function (er, data) {
    er = needName(er, data)
    er = needVersion(er, data)
    if (er) return cb(er)
    deprCheck(data)
    var random = Date.now() + "-" + Math.random()
      , tmp = path.join(npm.tmp, random)
      , tmptgz = path.resolve(tmp, "tmp.tgz")
      , placed = path.resolve( npm.cache, data.name
                             , data.version, "package.tgz" )
      , placeDirect = path.basename(p) === "package"
      , tgz = placeDirect ? placed : tmptgz
      , version = data.version

    name = data.name

    getCacheStat(function (er, cs) {
      mkdir(path.dirname(tgz), function (er, made) {
        if (er) return cb(er)

        var fancy = !pathIsInside(p, npm.tmp)
                    && !pathIsInside(p, npm.cache)
        tar.pack(tgz, p, data, fancy, function (er) {
          if (er) {
            log.error( "addLocalDirectory", "Could not pack %j to %j"
                     , p, tgz )
            return cb(er)
          }

          // if we don't get a cache stat, or if the gid/uid is not
          // a number, then just move on.  chown would fail anyway.
          if (!cs || isNaN(cs.uid) || isNaN(cs.gid)) return cb()

          chownr(made || tgz, cs.uid, cs.gid, function (er) {
            if (er) return cb(er)
            addLocalTarball(tgz, name, version, shasum, cb)
          })
        })
      })
    })
  })
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
