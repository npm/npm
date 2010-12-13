
exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("./log")
  , exec = require("./exec")
  , npm = require("../../npm")
  , path = require("path")
  , readJson = require("./read-json")
  , fs = require("./graceful-fs")
  , chain = require("./chain")

function lifecycle (pkg, stage, wd, cb) {
  while (pkg && pkg._data) pkg = pkg._data
  if (!pkg) return cb(new Error("Invalid package data"))
  if (typeof wd === "function") cb = wd , wd = null
  log(pkg._id, stage)

  // set the env variables, then run scripts as a child process.
  var env = makeEnv(pkg)
  env.npm_lifecycle_event = stage
  var pkgDir = path.join(npm.dir, pkg.name, pkg.version)
  env.PATH = path.join(pkgDir, "node_modules", ".bin")
           + ":" + path.join(pkgDir, "dep-bin")
           + (env.PATH ? ":" + env.PATH : "")

  var packageLifecycle = pkg.scripts && (stage in pkg.scripts)

  if (packageLifecycle) {
    // define this here so it's available to all scripts.
    env.npm_lifecycle_script = pkg.scripts[stage]
  }

  chain
    ( packageLifecycle && [runPackageLifecycle, pkg, env, wd]
    , [runHookLifecycle, pkg, env, wd]
    , cb
    )
}

function validWd (d) {
  var cwd = process.cwd()
  while (d) {
    try {
      process.chdir(d)
      break
    } catch (ex) {
      d = path.dirname(d)
    }
  }
  process.chdir(cwd)
  return d
}


function runPackageLifecycle (pkg, env, wd, cb) {
  // run package lifecycle scripts in the package root, or the nearest parent.
  var stage = env.npm_lifecycle_event
  var d = wd || path.join(npm.dir, pkg.name, pkg.version, "package")
  d = validWd(d)

  exec("sh", ["-c", env.npm_lifecycle_script], env, true, d,
       function (er, code, stdout, stderr) {
    if (er && !npm.ROLLBACK) {
      log("Failed to exec "+stage+" script", pkg._id)
      er.message = pkg._id + " "
                 + stage + ": `" + env.npm_lifecycle_script+"`\n"
                 + er.message
      er.errno = npm.ELIFECYCLE
      er.pkgid = pkg._id
      er.stage = stage
      er.script = env.npm_lifecycle_script
      er.pkgname = pkg.name
      return cb(er)
    } else if (er) {
      log.error(er, pkg._id+"."+stage)
      log.error("failed, but continuing anyway", pkg._id+"."+stage)
      return cb()
    }
    cb(er)
  })
}

function runHookLifecycle (pkg, env, wd, cb) {
  // check for a hook script, run if present.
  var stage = env.npm_lifecycle_event
  var hook = path.join(npm.dir, ".hooks", stage)
  var d = wd || path.join(npm.dir, pkg.name, pkg.version, "package")
  d = validWd(d)
  fs.stat(hook, function (er) {
    if (er) return cb()
    exec(hook, [], env, true, d, function (er) {
      if (er) {
        er.message += "\nFailed to exec "+stage+" hook script"
        log(er, pkg._id)
      }
      if (npm.ROLLBACK) return cb()
      cb(er)
    })
  })
}

function makeEnv (data, prefix, env) {
  prefix = prefix || "npm_package_"
  if (!env) {
    env = {}
    for (var i in process.env) env[i] = process.env[i]
  } else if (!data.hasOwnProperty("_lifecycleEnv")) {
    Object.defineProperty(data, "_lifecycleEnv",
      { value : env
      , enumerable : false
      })
  }
  for (var i in data) if (i.charAt(0) !== "_") {
    var envKey = (prefix+i).replace(/[^a-zA-Z0-9_]/g, '_')
    if (data[i] && typeof(data[i]) === "object") {
      env[envKey] = JSON.stringify(data[i])
      makeEnv(data[i], envKey+"_", env)
    } else {
      env[envKey] = String(data[i])
    }
  }
  if (prefix !== "npm_package_") return env
  prefix = "npm_config_"
  var conf = npm.config.get()
  for (var i in conf) if (i.charAt(0) !== "_") {
    var envKey = (prefix+i).replace(/[^a-zA-Z0-9_]/g, '_')
    env[envKey] = String(conf[i])
  }
  return env
}

function cmd (stage) {
  function CMD (args, cb) {
    chain(args.map(function (p) {
      return [npm.commands, "run-script", [p, stage]]
    }).concat(cb))
  }
  CMD.usage = "npm "+stage+" <name>[@<version>] [<name>[@<version>] ...]"
  CMD.completion = function (args, index, cb) {
    var installedPkgs = require("./utils/completion/installed-packages")
    installedPkgs(args, index, true, true, cb)
  }
  return CMD
}
