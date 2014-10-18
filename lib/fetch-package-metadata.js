"use strict"
var npm = require("./npm.js")
  , addRemoteTarball = require("./cache/add-remote-tarball.js")
  , addRemoteGit = require("./cache/add-remote-git.js")
  , mapToRegistry = require("./utils/map-to-registry.js")
  , fs = require("fs")
  , path = require("path")
  , log = require("npmlog")
  , realizePackageSpecifier = require("realize-package-specifier")
  , readJson = require("read-package-json")
  , tar = require("tar")
  , zlib = require("zlib")
  , once = require("once")
  , semver = require("semver")
  , inflight = require("inflight")

module.exports = function fetchPackageMetadata(spec, where, cb) {
  log.silly("fetchPackageMetaData", spec)
  realizePackageSpecifier(spec, where, function (er, dep) {
    if (er) {
      log.silly("fetchPackageMetaData", "error for "+spec, er)
      return cb(er)
    }
    var normalized = dep.name == null ? dep.spec : dep.name + "@" + dep.spec
    function addRequested(cb, dep) {
      return function (err, p) {
        if (p) {
          p.requested = dep
        }
        cb.call(this,err,p)
      }
    }
    cb = addRequested(cb, dep)
    cb = inflight("fetchPackageMetadata" + normalized, cb)
    if (!cb) return
    switch (dep.type) {
    case "git":
      fetchGitPackageData(dep, cb)
      break
    case "local":
      fetchLocalTarPackageData(dep, cb)
      break
    case "directory":
      fetchDirectoryPackageData(dep, cb)
      break
    case "remote":
      fetchRemoteTarPackageData(dep, cb)
      break
    case "hosted":
      fetchHostedGitPackageData(dep, cb)
      break
    default:
      fetchNamedPackageData(dep, cb)
    }
  })
}

function fetchRemoteTarPackageData(dep, cb) {
  log.silly("fetchRemoteTarPackageData", dep)
  mapToRegistry(dep.name || dep.rawSpec, npm.config, function (er, url, auth) {
    addRemoteTarball(dep.spec, null, null, auth, cb)
  })
}

function fetchGitPackageData(dep, cb) {
  log.silly("fetchGitPackageData", dep)
  addRemoteGit(dep.spec, false, cb)
}

function fetchHostedGitPackageData(dep, cb) {
  log.silly("fetchHostedGitPackageData", dep.hosted.directUrl)

  npm.registry.get(dep.hosted.directUrl, npm.config, function(er, p) {
      if (!er) return cb(er, p)
      log.silly("fetchHostedGitPackageData", er)
      log.silly("fetchHostedGitPackageData", dep.hosted.ssh)
      addRemoteGit(dep.hosted.ssh, false, cb)
  })
}

function fetchNamedPackageData(dep, cb) {
  log.silly("fetchNamedPackageData", dep.name || dep.rawSpec)
  mapToRegistry(dep.name || dep.rawSpec, npm.config, function (er, url, auth) {
    cb = inflight(url, cb)
    if (! cb) return
    npm.registry.get(url, {auth: auth}, function (er, p) {
      if (er) return cb(er)
      // TODO: This needs to take the spec into account here and not just
      // use latest, geez
      var latestVersion = p["dist-tags"].latest
      if (! latestVersion) {
        latestVersion = Object.keys(p.versions).sort(semver.rcompare)[0]
      }
      var latest = p.versions[latestVersion]

      cb(null, latest)
    })
  })
}

function fetchLocalTarPackageData(dep, cb) {
  log.silly("fetchLocalTarPackageData", dep.spec)
  cb = inflight("fetchLocalTarPackageData" + dep.spec, cb)
  if (! cb) return
  cb = once(cb)
  var file = fs.createReadStream(dep.spec)
  file.on("error", function (er) {
    er = new Error("Error extracting local tar archive: " + er.message)
    er.code = "EREADFILE"
  })
  var gunzip = file.pipe(zlib.createGunzip())
  gunzip.on("error", function (er) {
    er = new Error("Error extracting local tar archive: " + er.message)
    er.code = "EGUNZIP"
  })
  var untar = gunzip.pipe(tar.Parse())
  untar.on("error", function (er) {
    er = new Error("Error extracting local tar archive: " + er.message)
    er.code = "EUNTAR"
  })
  untar.on("entry", function(entry) {
    if (! /^(?:[^\/]+[\/])package.json$/.test(entry.path)) return
    gunzip.unpipe(untar)
    file.unpipe(gunzip)
    file.close()
    extractPackageJson(entry)
  })
  var extractPackageJson = once(function(entry) {
    var json = ""
    entry.on("data", function (chunk) { json += chunk })
    entry.on("end", function () {
      try {
        cb(null, JSON.parse(json))
      }
      catch (ex) {
        var er = new Error("Failed to parse json\n"+ex.message)
        er.code = "EJSONPARSE"
        er.file = path.join(dep.spec,entry.path)
        cb(er)
      }
    })
  })
}

function fetchDirectoryPackageData(dep, cb) {
  log.silly("fetchDirectoryPackageData", dep.spec)
  cb = inflight("fetchDirectoryPackageData" + dep.spec, cb)
  readJson(path.join(dep.spec, "package.json"), false, function (er, data) {
    if (er) return cb(er)
    if (! data.name) return cb(new Error("No name provided for " + dep.raw))
    if (! data.version) return cb(new Error("No version provided for " + dep.raw))
    if (dep.name && dep.name !== data.name) {
      return cb(new Error("Invalid Package: expected " + dep.name 
        + " but found " + data.name))
    }
    cb(null, data)
  })
}
