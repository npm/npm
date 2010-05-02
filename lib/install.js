// npm install command

var npm = require("../npm")
  , rm = require("./utils/rm-rf")
  , exec = require("./utils/exec")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , fetch = require("./utils/fetch")
  , fs = require("fs")
  , path = require("path")
  , mkdir = require("./utils/mkdir-p")
  , readJson = require("./utils/read-json")

module.exports = install

// cb called with (er, ok) args.
function install (args, cb) {
  var tarball = args.shift()
  // fetch the tarball
  if (tarball.match(/^https?:\/\//)) {
    log(tarball, "install")
    return fetchAndInstall(tarball, cb)
  }

  // install from a file.
  if (tarball.indexOf("file://") === 0) tarball = tarball.substr("file://".length)

  log(tarball, "install")

  var ROOT = npm.root
    , npmdir = npm.dir
    , tmp = npm.tmp
    , unpackTargetDir = path.join(tmp, path.basename(tarball, ".tgz"))
    , unpackTargetTgz = path.join(unpackTargetDir, "package.tgz")
    , pkg = {}

  // at this point, presumably the filesystem knows how to open it.
  chain
    ( [fs, "stat", tarball]
    , [mkdir, unpackTargetDir]
    , [unpackTar, tarball, unpackTargetDir]
    // read the json and then save it
    , function (cb) {
        readJson(path.join(unpackTargetDir, "package.json"), function (er, data) {
          if (er) return cb(er, data)
          // save this just for this install
          npm.set(data._id, data)
          pkg._data = data
          cb(null, data)
        })
      }
    // move to ROOT/.npm/{name}/{version}/package
    , [moveIntoPlace, unpackTargetDir, pkg]
    , [npm.commands, "build", [pkg]]
    , cb
    )
}

// move to ROOT/.npm/{name}/{version}/package
function moveIntoPlace (dir, pkg, cb) {
  pkg = pkg._data
  if (!pkg.name || !pkg.version) {
    return cb(new Error("Name or version not found in package info."))
  }
  var target = path.join(npm.dir, pkg.name, pkg.version)

  log("to: "+pkg.name+"-"+pkg.version+" from: "+dir, "moveIntoPlace")
  log(cb, "moveIntoPlace cb")
  chain
    ( function (cb) {
        path.exists(target, function (e) {
          log((e?"remove":"creating") + " " +target, "moveIntoPlace")
          if (e) rm(target, function (er, ok) {
            if (er) {
              log("could not remove " + target, "moveIntoPlace")
              cb(new Error(target+" exists, and can't be removed"))
            } else {
              log("unlinked "+target,"moveIntoPlace")
              cb()
            }
          })
          else cb()
        })
      }
    , [mkdir, target]
    , function (cb) { pkg._npmPackage = target = path.join(target, "package"); cb() }
    , function (cb) { fs.rename(dir, target, cb) }
    , [log, "done", "moveIntoPlace"]
    , cb
    )
}

function fetchAndInstall (tarball, cb) {
  mkdir(npm.tmp, function (er, ok) {
    if (er) return cb(er, ok)
    var target = path.join(npm.tmp, tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+
                           Date.now()+"-"+Math.random()+".tgz")

    fetch(tarball, target, function (er, ok) {
      if (er) return cb(er, ok)
      chain
        ( [install, [target]]
          // clean up
        , [log, target, "deleting"]
        , [rm, target]
        , [rm, target.replace(/\.tgz$/, '')]
        , cb
        )
    })
  })
}

function unpackTar (tarball, unpackTarget, cb) {
  exec("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget], cb)
}
