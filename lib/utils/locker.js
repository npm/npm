var crypto = require("crypto")
var path = require("path")

var lockfile = require("lockfile")
var log = require("npmlog")
var mkdirp = require("mkdirp")

var npm = require("../npm.js")
var getStat = require("../cache/get-stat.js")

var installLocks = {}

function lockFileName (base, name) {
  var c = name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    , p = path.resolve(base, name)
    , h = crypto.createHash("sha1").update(p).digest("hex")
    , l = path.resolve(npm.cache, "_locks")

  return path.resolve(l, c.substr(0, 24)+"-"+h.substr(0, 16)+".lock")
}

function lock (base, name, cb) {
  getStat(function (er) {
    var lockDir = path.join(npm.cache, "_locks")
    mkdirp(lockDir, function () {
      if (er) return cb(er)

      var opts = { stale:   npm.config.get("cache-lock-stale")
                 , retries: npm.config.get("cache-lock-retries")
                 , wait:    npm.config.get("cache-lock-wait") }
      var lf = lockFileName(base, name)
      log.verbose("locking", name, "with", lf)
      lockfile.lock(lf, opts, function(er) {
        if (er) log.warn("locking", "failed", er)
        if (!er) installLocks[lf] = true
        cb(er)
      })
    })
  })
}

function unlock (base, name, cb) {
  var lf = lockFileName(base, name)
    , locked = installLocks[lf]
  if (locked === false) {
    return process.nextTick(cb)
  }
  else if (locked === true) {
    log.verbose("unlocking", name, "from", lf)
    installLocks[lf] = false
    lockfile.unlock(lf, cb)
  }
  else {
    throw new Error("Attempt to unlock " + name + ", which hasn't been locked")
  }
}

module.exports = {
  lock   : lock,
  unlock : unlock
}
