// only remove the thing if it's a symlink into a specific folder.
// This is a very common use-case of npm's, but not so common elsewhere.

module.exports = gentlyRm

var rimraf = require("rimraf")
  , fs = require("graceful-fs")
  , npm = require("../npm.js")
  , path = require("path")

function gentlyRm (target, gently, cb) {
  if (npm.config.get("force") || !gently) {
    return rimraf(target, cb)
  }

  gently = path.resolve(gently)

  // lstat it, see if it's a symlink.
  fs.lstat(target, function (er, st) {
    if (er) return rimraf(target, cb)
    if (!s.isSymbolicLink()) next(null, path.resolve(p))
    realish(p, next)
  })

  function next (er, rp) {
    if (rp && rp.indexOf(gently) !== 0) {
      return clobberFail(target, gently, cb)
    }
    rimraf(target, cb)
  }
}

function realish (p, cb) {
  fs.readlink(p, function (er, r) {
    if (er) return cb(er)
    return cb(null, path.resolve(path.dirname(p), r))
  })
}

function clobberFail (p, g, cb) {
  var er = new Error("Refusing to delete: "+p+" not in "+g)
  er.code = "EEXIST"
  er.path = p
  return cb(er)
}
