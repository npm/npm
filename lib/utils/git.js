
// handle some git configuration for windows

exports.spawn = spawnGit
exports.chainableExec = chainableExec
exports.whichAndExec = whichAndExec

var exec = require("child_process").execFile
  , spawn = require("child_process").spawn
  , npm = require("../npm.js")
  , which = require("which")
  , git = npm.config.get("git")
  , assert = require("assert")
  , log = require("npmlog")

function prefixGitArgs() {
  return process.platform === "win32" ? ["-c", "core.longpaths=true"] : []
}

var execCount = 0,
    maxConcurrent = +(npm.config.get("git-max-concurrent") || 10),
    execQueue = []

function execGit(args, options, cb) {
  log.info("git", args)
  if (execCount >= maxConcurrent) {
    if (maxConcurrent == -1) {
      // No concurrent connection limit, fallback to old way and use callback directly
      return exec(git, prefixGitArgs().concat(args || []), options, cb)
    }
    else {
      // If we are over the limit of concurrent git executions, then push this one onto a FIFO
      // queue for later execution once the inflight ones have completed
      log.info("git", "more than "+maxConcurrent+" concurrent git executions, deferring: " + args)
      execQueue.push([args, options, cb])
    }
  }
  else {
    // If we are under the concurrent execution limit, the execute git but wrap callback
    // with a new one that will check and drain the queue of waiting git calls
    execCount++
    var drainAndCallback = function() {
      execCount--
      if (execQueue.length > 0) {
        log.info("git", "executing queued git command: " + args)
        execGit.apply(null, execQueue.shift())
      }
      cb.apply(this, arguments);
    };
    return exec(git, prefixGitArgs().concat(args || []), options, drainAndCallback)
  }
}

function spawnGit(args, options, cb) {
  log.info("git", args)
  return spawn(git, prefixGitArgs().concat(args || []), options)
}

function chainableExec() {
  var args = Array.prototype.slice.call(arguments)
  return [execGit].concat(args)
}

function whichGit(cb) {
  return which(git, cb)
}

function whichAndExec(args, options, cb) {
  assert.equal(typeof cb, "function", "no callback provided")
  // check for git
  whichGit(function (err) {
    if (err) {
      err.code = "ENOGIT"
      return cb(err)
    }

    execGit(args, options, cb)
  })
}
