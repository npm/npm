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
function checkGitDir (p, u, co, origUrl, silent, ca, t, git, log, gitDoneCb, cb) {
  fs.stat(p, function (er, s) {
    if (er) return cloneGitRemote(p, u, co, origUrl, silent
      , ca, t, git, log, gitDoneCb, cb)
    if (!s.isDirectory()) return rm(p, function (er){
      if (er) return cb(er)
      cloneGitRemote(p, u, co, origUrl, silent, ca, t, git, log, gitDoneCb, cb)
    })

    var args = [ "config", "--get", "remote.origin.url" ]
    var env = gitEnv()

    // check for git
    which(git, function (err) {
      if (err) {
        err.code = "ENOGIT"
        return cb(err)
      }
      exec(git, args, {cwd: p, env: env}, function (er, stdout, stderr) {
        stdoutTrimmed = (stdout + "\n" + stderr).trim()
        if (er || u !== stdout.trim()) {
          log.warn( "`git config --get remote.origin.url` returned "
                  + "wrong result ("+u+")", stdoutTrimmed )
          return rm(p, function (er) {
            if (er) return cb(er)
            cloneGitRemote(p, u, co, origUrl, silent
              , c, t, git, log, gitDoneCb, cb)
          })
        }
        log.verbose("git remote.origin.url", stdoutTrimmed)
        archiveGitRemote(p, u, co, origUrl, ca, t, git, log, gitDoneCb, cb)
      })
    })
  })
}

exports.cloneGitRemote = cloneGitRemote
function cloneGitRemote (p, u, co, origUrl, silent, ca, t, git, log, gitDoneCb, cb) {
  mkdir(p, function (er) {
    if (er) return cb(er)

    var args = [ "clone", "--mirror", u, p ]
    var env = gitEnv()

    // check for git
    which(git, function (err) {
      if (err) {
        err.code = "ENOGIT"
        return cb(err)
      }
      exec(git, args, {cwd: p, env: env}, function (er, stdout, stderr) {
        stdout = (stdout + "\n" + stderr).trim()
        if (er) {
          if (silent) {
            log.verbose("git clone " + u, stdout)
          } else {
            log.error("git clone " + u, stdout)
          }
          return cb(er)
        }
        log.verbose("git clone " + u, stdout)
        archiveGitRemote(p, u, co, origUrl, ca, t, git, log, gitDoneCb, cb)
      })
    })
  })
}

exports.archiveGitRemote = archiveGitRemote
function archiveGitRemote (p, u, co, origUrl, ca, t, git, log, gitDoneCb, cb) {
  var archive = [ "fetch", "-a", "origin" ]
  var resolve = [ "rev-list", "-n1", co ]
  var env = gitEnv()

  var errState = null
  var n = 0
  var resolved = null
  var tmp

  exec(git, archive, {cwd: p, env: env}, function (er, stdout, stderr) {
    stdout = (stdout + "\n" + stderr).trim()
    if (er) {
      log.error("git fetch -a origin ("+u+")", stdout)
      return cb(er)
    }
    log.verbose("git fetch -a origin ("+u+")", stdout)
    tmp = path.join(t, Date.now()+"-"+Math.random(), "tmp.tgz")
    verifyOwnership()
  })

  function verifyOwnership() {
    if (process.platform === "win32") {
      log.silly("verifyOwnership", "skipping for windows")
      resolveHead()
    } else {
      getCacheStat(ca, log, function(er, cs) {
        if (er) {
          log.error("Could not get cache stat")
          return cb(er)
        }
        chownr(p, cs.uid, cs.gid, function(er) {
          if (er) {
            log.error("Failed to change folder ownership under npm cache for %s", p)
            return cb(er)
          }
          resolveHead()
        })
      })
    }
  }

  function resolveHead () {
    exec(git, resolve, {cwd: p, env: env}, function (er, stdout, stderr) {
      stdout = (stdout + "\n" + stderr).trim()
      if (er) {
        log.error("Failed resolving git HEAD (" + u + ")", stderr)
        return cb(er)
      }
      log.verbose("git rev-list -n1 " + co, stdout)
      var parsed = url.parse(origUrl)
      parsed.hash = stdout
      resolved = url.format(parsed)

      // https://github.com/npm/npm/issues/3224
      // node incorrectly sticks a / at the start of the path
      // We know that the host won't change, so split and detect this
      var spo = origUrl.split(parsed.host)
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
      var args = ["archive", co, "--format=tar", "--prefix=package/"]
      var out = fs.createWriteStream(tmp)
      cb = once(cb)
      var cp = spawn(git, args, { env: env, cwd: p })
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
