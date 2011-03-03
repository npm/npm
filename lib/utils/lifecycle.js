
exports = module.exports = lifecycle
exports.cmd = cmd

var log = require("./log")
  , exec = require("./exec")
  , npm = require("../../npm")
  , path = require("path")
  , readJson = require("./read-json")
  , fs = require("./graceful-fs")
  , chain = require("./chain")
  , asyncMap = require("./async-map")
  , constants = require("constants")

function lifecycle (pkg, stage, wd, cb) {
  while (pkg && pkg._data) pkg = pkg._data
  if (typeof wd === "function") cb = wd , wd = null
  if (!pkg) return cb(new Error("Invalid package data"))
  log(pkg._id, stage)

  var pkgdir = path.join(npm.dir, pkg.name, pkg.version, "package")
  wd = validWd(wd || pkgdir)
  if (wd !== pkgdir && !npm.config.get("unsafe-perm")) {
    log.warn(pkg._id, "Skipping "+stage+" script, since it'll fail.")
    return cb()
  }

  // set the env variables, then run scripts as a child process.
  var env = makeEnv(pkg)
  env.npm_lifecycle_event = stage
  if (!npm.config.get("unsafe-perm")) env.TMPDIR = wd
  var pkgDir = path.join(npm.dir, pkg.name, pkg.version)

  if (wd.indexOf(npm.dir) !== 0) {
    pkg._link = true
  }

  if (pkg.version.match(/^9999.0.0-LINK-[0-9a-f]{8}$/)
      && !pkg.hasOwnProperty("_link")) {
    return checkForLink(pkg, function (er, l) {
      pkg._link = l
      lifecycle_(pkg, stage, wd, pkgDir, env, cb)
    })
  }
  lifecycle_(pkg, stage, wd, pkgDir, env, cb)
}

function checkForLink (pkg, cb) {
  var f = path.join(npm.dir, pkg.name, pkg.version, "package")
  fs.lstat(f, function (er, s) {
    cb(null, !(er || !s.isSymbolicLink()))
  })
}

function lifecycle_ (pkg, stage, wd, pkgDir, env, cb) {
  env.PATH = path.join(pkgDir, "node_modules", ".bin")
           + ":" + path.join(pkgDir, "dep-bin")
           + (env.PATH ? ":" + env.PATH : "")

  var packageLifecycle = pkg.scripts && (stage in pkg.scripts)

  if (packageLifecycle) {
    // define this here so it's available to all scripts.
    env.npm_lifecycle_script = pkg.scripts[stage]
  }

  chain
    ( [addDepsToEnv, pkg, env, wd]
    , packageLifecycle && [runPackageLifecycle, pkg, env, wd]
    , [runHookLifecycle, pkg, env, wd]
    , cb
    )
}

// attempt to resolve installed deps, and attach to env.
// if it fails, then just leave it blank.
function addDepsToEnv (pkg, env, wd, cb_) {
  if (pkg._resolvedDeps && pkg._bundledDeps) {
    return cb(null, pkg._resolvedDeps, pkg._bundledDeps)
  }
  else readDeps(pkg, wd, cb)
  function cb (er, deps, bundled) {
    if (er) return cb_(er)
    pkg._bundledDeps = bundled
    var bundledir = path.join(wd, "node_modules", npm.config.get('dotnpm'))
    deps.forEach(add(npm.dir, "npm_dependency_"))
    bundled.forEach(add(bundledir, "npm_dependency_"))
    bundled.forEach(add(bundledir, "npm_bundle_"))
    function add (root, prefix) { return function (d) {
      env[prefix+(d.name)] = d.version
      env[prefix+(d.name)+"_path"] =
        path.join(root, d.name, d.version, "package")
    }}
    cb_()
  }
}

function readDeps (pkg, wd, cb) {
  var pkgdir = path.join(npm.dir, pkg.name, pkg.version)
    , depdir = path.join(pkgdir, "dependson")
    , bundledir = path.join(wd, "node_modules", npm.config.get('dotnpm'))
  fs.readdir(depdir, function (er, dn) {
    done(er ? [] : dn.map(function (dn) {
      dn = dn.split("@")
      var n = dn.shift()
        , v = dn.join("@")
      return {name:n, version:v}
    }))
  }, cb)
  fs.readdir(bundledir, function (er, bn) {
    if (er) return done(null, [])
    asyncMap(bn || [], function (bn, cb) {
      fs.readlink(path.join(bundledir, bn, "active"), function (er, a) {
        if (er || !a) return cb()
        cb(null, {name: bn, version: a.replace(/^\.\//, "")})
      })
    }, function (er, b) {
      return done(null, b || [])
    })
  })
  var deps
    , bundled
  function done (d, b) {
    deps = deps || d
    bundled = bundled || b
    if (deps && bundled) {
      return cb(null, deps, bundled)
    }
  }
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
    , up = npm.config.get("unsafe-perm")
    , user = pkg._link || up ? null : npm.config.get("user")
    , group = pkg._link || up ? null : npm.config.get("group")
    , cmd = env.npm_lifecycle_script
    , cwd = process.cwd()

  log.verbose(up, "unsafe-perm in lifecycle")
  process.chdir(wd)
  exec( "sh", ["-c", cmd], env, true, wd
      , user, group
      , function (er, code, stdout, stderr) {
    process.chdir(cwd)
    if (er && !npm.ROLLBACK) {
      log("Failed to exec "+stage+" script", pkg._id)
      er.message = pkg._id + " "
                 + stage + ": `" + env.npm_lifecycle_script+"`\n"
                 + er.message
      if (er.errno !== constants.EPERM) {
        er.errno = npm.ELIFECYCLE
      }
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
    , up = npm.config.get("unsafe-perm")
    , hook = path.join(npm.dir, ".hooks", stage)
    , user = pkg._link || up ? null : npm.config.get("user")
    , group = pkg._link || up ? null : npm.config.get("group")
    , cmd = hook

  fs.stat(hook, function (er) {
    if (er) return cb()

    var cwd = process.cwd()
    process.chdir(wd)
    exec( "sh", ["-c", cmd], env, true, wd
        , user, group
        , function (er) {
      process.chdir(cwd)
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
    , pkgConfig = {}
    , pkgVerConfig = {}
    , namePref = data.name + ":"
    , verPref = data.name + "@" + data.version + ":"
  for (var i in conf) if (i.charAt(0) !== "_") {
    var value = String(conf[i])
    if (i.indexOf(namePref) === 0) {
      pkgConfig[ i.substr(namePref.length) ] = value
    } else if (i.indexOf(verPref) === 0) {
      pkgVerConfig[ i.substr(verPref.length) ] = value
    }
    var envKey = (prefix+i)
    env[envKey] = value
  }
  prefix = "npm_package_config_"
  ;[pkgConfig, pkgVerConfig].forEach(function (conf) {
    for (var i in conf) {
      var envKey = (prefix+i)
      env[envKey] = conf[i]
    }
  })
  return env
}

function cmd (stage) {
  function CMD (args, cb) {
    if (args.length) {
      chain(args.map(function (p) {
        return [npm.commands, "run-script", [p, stage]]
      }).concat(cb))
    } else npm.commands["run-script"]([stage], cb)
  }
  CMD.usage = "npm "+stage+" <name>[@<version>] [<name>[@<version>] ...]"
  CMD.completion = function (args, index, cb) {
    var installedPkgs = require("./utils/completion/installed-packages")
    installedPkgs(args, index, true, true, cb)
  }
  return CMD
}
