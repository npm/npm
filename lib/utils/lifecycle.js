
exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("./log")
  , exec = require("./exec")
  , npm = require("../../npm")
  , path = require("path")
  , readJson = require("./read-json")

function lifecycle (pkg, stage, cb) {
  while (pkg && pkg._data) pkg = pkg._data
  if (!pkg) return cb(new Error("Invalid package data"))
  if (!pkg.scripts || !(stage in pkg.scripts)) return cb()

  // run package lifecycle scripts in the package root, or the nearest parent.
  var d = path.join(npm.dir, pkg.name, pkg.version, "package")
  while (d) {
    try {
      process.chdir(d)
      break
    } catch (ex) {
      d = path.dirname(d)
    }
  }
  log(pkg._id + " " + stage, "lifecycle")

  // set the env variables, then run the script as a child process.
  // NOTE: The env vars won't work until node supports env hashes for child procs
  var env = makeEnv(pkg)
  env.npm_lifecycle_event = stage
  env.npm_lifecycle_script = pkg.scripts[stage]

  exec("sh", ["-c", env.npm_lifecycle_script], env, log.er(cb,
    "Failed to exec "+stage+" script"))
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
    if (data[i] && typeof(data[i]) === "object") {
      env[prefix+i] = JSON.stringify(data[i])
      makeEnv(data[i], prefix+i+"_", env)
    } else {
      env[prefix+i] = String(data[i])
    }
  }
  if (prefix !== "npm_package_") return env
  prefix = "npm_config_"
  var conf = npm.config.get()
  for (var i in conf) if (i.charAt(0) !== "_" && i !== "auth") {
    env[prefix+i] = String(conf[i])
  }
  return env
}

function cmd (stage) { return function (args, cb) {
  var pkg = args[0]
    , ver = pkg.indexOf("/") !== -1 ? "" : (args[1] || "active")
    , json = path.join(npm.dir, pkg, ver, "package/package.json")
  readJson(json, function (er, data) {
    data.version = ver
    if (er) return log.er(cb, "Couldn't find "+path.join(pkg, ver))(er)
    if ( !data.scripts
        || !(stage in data.scripts)
        && !("pre"+stage in data.scripts)) {
      return log("Nothing to do", stage, cb)
    }
    lifecycle(data, "pre"+stage, function (er) {
      if (er) return log.er(cb, "Failed pre"+stage)(er)
      lifecycle(data, stage, cb)
    })
  })
}}
