var chownr = require("chownr")
  , getCacheStat = require("npm-cache-dir").getCacheStat
  , exec = require("child_process").execFile
  , url = require("url")
  , mkdir = require("mkdirp")
  , path = require("path")
  , zlib = require("zlib")
  , once = require("once")
  , fs = require("graceful-fs")
  , spawn = require("child_process").spawn
  , which = require("which")


// 1. checkGitDir(cacheDir) ? 4. : 3. (rm cacheDir if necessary)
// 2. git clone --mirror u cacheDir
// 3. cd cacheDir && git fetch -a origin
// 4. git archive /tmp/random.tgz
// 5. addLocalTarball(/tmp/random.tgz) <gitref> --format=tar --prefix=package/
// silent flag is used if this should error quietly
exports.checkGitDir = checkGitDir
function checkGitDir (rm, opts, log, gitDoneCb, cb) {
  fs.stat(opts.p, function (er, s) {
    if (er) return cloneGitRemote(opts, log, gitDoneCb, cb)
    if (!s.isDirectory()) return rm(opts.p, function (er) {
      if (er) return cb(er)
      cloneGitRemote(opts, log, gitDoneCb, cb)
    })

    var args = [ "config", "--get", "remote.origin.url" ]
    var env = gitEnv()

    // check for git
    which(opts.git, function (err) {
      if (err) {
        err.code = "ENOGIT"
        return cb(err)
      }
      exec(opts.git, args, {cwd: opts.p, env: env}, function (er, stdout, stderr) {
        stdoutTrimmed = (stdout + "\n" + stderr).trim()
        if (er || opts.u !== stdout.trim()) {
          log.warn( "`git config --get remote.origin.url` returned "
                  + "wrong result (" + opts.u + ")", stdoutTrimmed )
          return rm(opts.p, function (er) {
            if (er) return cb(er)
            cloneGitRemote(opts, log, gitDoneCb, cb)
          })
        }
        log.verbose("git remote.origin.url", stdoutTrimmed)
        archiveGitRemote(opts, log, gitDoneCb, cb)
      })
    })
  })
}

exports.cloneGitRemote = cloneGitRemote
function cloneGitRemote (opts, log, gitDoneCb, cb) {
  mkdir(opts.p, function (er) {
    if (er) return cb(er)

    var args = [ "clone", "--mirror", opts.u, opts.p ]
    var env = gitEnv()

    // check for git
    which(opts.git, function (err) {
      if (err) {
        err.code = "ENOGIT"
        return cb(err)
      }
      exec(opts.git, args, {cwd: opts.p, env: env}, function (er, stdout, stderr) {
        stdout = (stdout + "\n" + stderr).trim()
        if (er) {
          if (opts.silent) {
            log.verbose("git clone " + opts.u, stdout)
          } else {
            log.error("git clone " + opts.u, stdout)
          }
          return cb(er)
        }
        log.verbose("git clone " + opts.u, stdout)
        archiveGitRemote(opts, log, gitDoneCb, cb)
      })
    })
  })
}

exports.archiveGitRemote = archiveGitRemote
function archiveGitRemote (opts, log, gitDoneCb, cb) {
  var archive = [ "fetch", "-a", "origin" ]
  var resolve = [ "rev-list", "-n1", opts.co ]
  var env = gitEnv()

  var errState = null
  var n = 0
  var resolved = null
  var tmp

  exec(opts.git, archive, {cwd: opts.p, env: env}, function (er, stdout, stderr) {
    stdout = (stdout + "\n" + stderr).trim()
    if (er) {
      log.error("git fetch -a origin (" + opts.u + ")", stdout)
      return cb(er)
    }
    log.verbose("git fetch -a origin (" + opts.u + ")", stdout)
    tmp = path.join(opts.tmp, Date.now() + "-" + Math.random(), "tmp.tgz")
    verifyOwnership()
  })

  function verifyOwnership() {
    if (process.platform === "win32") {
      log.silly("verifyOwnership", "skipping for windows")
      resolveHead()
    } else {
      getCacheStat(opts.ca, log, function (er, cs) {
        if (er) {
          log.error("Could not get cache stat")
          return cb(er)
        }
        chownr(opts.p, cs.uid, cs.gid, function (er) {
          if (er) {
            log.error("Failed to change folder ownership under npm cache for %s", opts.p)
            return cb(er)
          }
          resolveHead()
        })
      })
    }
  }

  function resolveHead () {
    exec(opts.git, resolve, {cwd: opts.p, env: env}, function (er, stdout, stderr) {
      stdout = (stdout + "\n" + stderr).trim()
      if (er) {
        log.error("Failed resolving git HEAD (" + opts.u + ")", stderr)
        return cb(er)
      }
      log.verbose("git rev-list -n1 " + opts.co, stdout)
      var parsed = url.parse(opts.origUrl)
      parsed.hash = stdout
      resolved = url.format(parsed)

      // https://github.com/npm/npm/issues/3224
      // node incorrectly sticks a / at the start of the path
      // We know that the host won't change, so split and detect this
      var spo = opts.origUrl.split(parsed.host)
      var spr = resolved.split(parsed.host)
      if (spo[1].charAt(0) === ':' && spr[1].charAt(0) === '/')
        spr[1] = spr[1].slice(1)
      resolved = spr.join(parsed.host)

      log.verbose('resolved git url', resolved)
      next()
    })
  }

  function next () {
    mkdir(path.dirname(tmp), function (er) {
      if (er) return cb(er)
      var gzip = zlib.createGzip({ level: 9 })
      var args = ["archive", opts.co, "--format=tar", "--prefix=package/"]
      var out = fs.createWriteStream(tmp)
      cb = once(cb)
      var cp = spawn(opts.git, args, { env: env, cwd: opts.p })
      cp.on("error", cb)
      cp.stderr.on("data", function(chunk) {
        log.silly(chunk.toString(), "git archive")
      })

      cp.stdout.pipe(gzip).pipe(out).on("close", function () {
        return gitDoneCb(tmp, resolved, cb)
      })
    })
  }
}

var gitEnv_
function gitEnv () {
  // git responds to env vars in some weird ways in post-receive hooks
  // so don't carry those along.
  if (gitEnv_) return gitEnv_
  gitEnv_ = {}
  for (var k in process.env) {
    if (!~['GIT_PROXY_COMMAND','GIT_SSH','GIT_SSL_NO_VERIFY'].indexOf(k) && k.match(/^GIT/)) continue
    gitEnv_[k] = process.env[k]
  }
  return gitEnv_
}
