exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("npmlog")
  , npm = require("../npm.js")
  , pkgexec = require("./pkgexec.js")
  , path = require("path")
  , fs = require("graceful-fs")
  , chain = require("slide").chain

function lifecycle (pkg, stage, wd, unsafe, failOk, cb) {
  if (typeof cb !== "function") cb = failOk, failOk = false
  if (typeof cb !== "function") cb = unsafe, unsafe = false
  if (typeof cb !== "function") cb = wd, wd = null

  while (pkg && pkg._data) pkg = pkg._data
  if (!pkg) return cb(new Error("Invalid package data"))

  log.info(stage, pkg._id)
  if (!pkg.scripts) pkg.scripts = {}

  validWd(wd || path.resolve(npm.dir, pkg.name), function (er, wd) {
    if (er) return cb(er)

    unsafe = unsafe || npm.config.get("unsafe-perm")

    if ((wd.indexOf(npm.dir) !== 0 || path.basename(wd) !== pkg.name)
        && !unsafe && pkg.scripts[stage]) {
      log.warn( "cannot run in wd", "%s %s (wd=%s)"
              , pkg._id, pkg.scripts[stage], wd)
      return cb()
    }

    lifecycle_(pkg, stage, wd, failOk, cb)
  })
}

function lifecycle_ (pkg, stage, wd, failOk, cb) {
  var packageLifecycle = pkg.scripts && pkg.scripts.hasOwnProperty(stage)
    , env = {}

  if (!packageLifecycle) return cb()

  // define this here so it's available to all scripts.
  env.npm_lifecycle_event = stage
  env.npm_lifecycle_script = pkg.scripts[stage]

  // "nobody" typically doesn't have permission to write to /tmp
  // even if it's never used, sh freaks out.
  if (!npm.config.get("unsafe-perm")) env.TMPDIR = wd

  if (failOk) {
    cb = (function (cb_) { return function (er) {
      if (er) log.warn("continuing anyway", er.message)
      cb_()
    }})(cb)
  }

  if (npm.config.get("force")) {
    cb = (function (cb_) { return function (er) {
      if (er) log.info("forced, continuing", er)
      cb_()
    }})(cb)
  }

  runPackageLifecycle(pkg, env, wd, cb)
}

function runPackageLifecycle (pkg, env, wd, cb) {
  // run package lifecycle scripts in the package root, or the nearest parent.
  var stage = env.npm_lifecycle_event
    , cmd = env.npm_lifecycle_script.split(/\s+/)
    , sh = cmd.shift()
    , args = cmd

  pkgexec(sh, args, pkg, wd, env, function(er) {
    if (er && !npm.ROLLBACK) {
      er.stage = stage
      return cb(er)
    }

    cb()
  });
}

function validWd (d, cb) {
  fs.stat(d, function (er, st) {
    if (er || !st.isDirectory()) {
      var p = path.dirname(d)
      if (p === d) {
        return cb(new Error("Could not find suitable wd"))
      }
      return validWd(p, cb)
    }
    return cb(null, d)
  })
}

function cmd (stage) {
  function CMD (args, cb) {
    if (args.length) {
      chain(args.map(function (p) {
        return [npm.commands, "run-script", [p, stage]]
      }), cb)
    } else npm.commands["run-script"]([stage], cb)
  }
  CMD.usage = "npm "+stage+" <name>"
  var installedShallow = require("./completion/installed-shallow.js")
  CMD.completion = function (opts, cb) {
    installedShallow(opts, function (d) {
      return d.scripts && d.scripts[stage]
    }, cb)
  }
  return CMD
}
