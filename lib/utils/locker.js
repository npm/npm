var crypto = require("crypto")
var path = require("path")

var npm = require("../npm.js")
var lockfile = require("lockfile")
var log = require("npmlog")
var mkdirp = require("mkdirp")

var installLocks = {}
function lockFileName (base, name) {
  var c = name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    , h = crypto.createHash("sha1").update(name).digest("hex")

  return path.resolve(base, "."+h.substr(0, 8)+"-"+c.substr(-32)+".lock")
}

function lock (base, name, cb) {
  mkdirp(base, function (er) {
    if (er) return cb(er)

    var opts = { stale:   npm.config.get("cache-lock-stale")
               , retries: npm.config.get("cache-lock-retries")
               , wait:    npm.config.get("cache-lock-wait") }
    var lf = lockFileName(base, name)
    log.verbose("locking", name, "with", lf)
    lockfile.lock(lf, opts, function(er) {
      if (!er) installLocks[lf] = true
      cb(er)
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
