
exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("./log")
  , exec = require("./exec")
  , npm = require("../../npm")
  , path = require("path")
  , readJson = require("./read-json")
  , fs = require("./graceful-fs")
  , chain = require("./chain")

function lifecycle (pkg, stage, cb) {
  while (pkg && pkg._data) pkg = pkg._data
  if (!pkg) return cb(new Error("Invalid package data"))
  log.verbose(pkg._id, "lifecycle "+stage)

  // set the env variables, then run scripts as a child process.
  var env = makeEnv(pkg)
  env.npm_lifecycle_event = stage

  var packageLifecycle = pkg.scripts && (stage in pkg.scripts)

  if (packageLifecycle) {
    // define this here so it's available to all scripts.
    env.npm_lifecycle_script = pkg.scripts[stage]
  }

  log.silly(env, "lifecycle env")
  chain
    ( packageLifecycle && [runPackageLifecycle, pkg, env]
    , [runHookLifecycle, pkg, env]
    , cb
    )
}

function runPackageLifecycle (pkg, env, cb) {
  // run package lifecycle scripts in the package root, or the nearest parent.
  var stage = env.npm_lifecycle_event
  var d = path.join(npm.dir, pkg.name, pkg.version, "package")
  while (d) {
    try {
      process.chdir(d)
      break
    } catch (ex) {
      d = path.dirname(d)
    }
  }
  log(pkg._id, stage)

  exec("sh", ["-c", env.npm_lifecycle_script], env, function (er) {
    if (er && !npm.ROLLBACK) {
      log("Failed to exec "+stage+" script", pkg._id)
      er.message = pkg._id + " " + stage + ": `" + env.npm_lifecycle_script+"`\n"
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
    }
    cb(er)
  })
}

function runHookLifecycle (pkg, env, cb) {
  // check for a hook script, run if present.
  var stage = env.npm_lifecycle_event
  var hook = path.join(npm.dir, ".hooks", stage)
  fs.stat(hook, function (er) {
    if (er) return cb()
    exec(hook, [], env, function (er) {
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
  if (data._lifecycleEnv) return data._lifecycleEnv
  prefix = prefix || "npm_package_"
  if (!env) {
    env = {}
    for (var i in process.env) env[i] = process.env[i]
  } else {
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

function cmd (stage, req) { return function (args, cb_) {
  var d = args.length
  function cb (er) {
    if (er) return cb_(er)
    if (-- d === 0) return cb_()
  }
  args.forEach(function (arg) {
    var pkg = arg.split("@")
      , name = pkg.shift()
      , ver = pkg.join("@")
      , json = path.join(npm.dir, name, ver || "active", "package/package.json")
    readJson(json, function (er, data) {
      if (er) return log.er(cb, "Couldn't find "+name + "@" + ver)(er)
      if (ver && ver !== data.version) {
        data.version = ver
        data._id = data.name+"@"+ver
      }
      if ( !data.scripts
          || !(stage in data.scripts)
          && !("pre"+stage in data.scripts)) {
        log("Nothing to do", stage)
        return cb(req ? new Error("Nothing to do") : null)
      }
      lifecycle(data, "pre"+stage, function (er) {
        if (er) return log.er(cb, "Failed pre"+stage)(er)
        lifecycle(data, stage, cb)
      })
    })
  })
}}
