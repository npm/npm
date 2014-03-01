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


exports.archiveGitRemote = archiveGitRemote
function archiveGitRemote (p, u, co, origUrl, cache, tmp, git, log, gitDoneCb, cb) {
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
    tmp = path.join(tmp, Date.now()+"-"+Math.random(), "tmp.tgz")
    verifyOwnership()
  })

  function verifyOwnership() {
    if (process.platform === "win32") {
      log.silly("verifyOwnership", "skipping for windows")
      resolveHead()
    } else {
      getCacheStat(cache, log, function(er, cs) {
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
