
module.exports = lifecycle;

var log = require("../utils").log,
  exec = require("../utils/exec"),
  npm = require("../../npm"),
  path = require("path");

function lifecycle (pkg, stage, cb) {
  while (pkg && pkg._data) pkg = pkg._data;
  if (!pkg) return cb(new Error("Invalid package data"));
  if (!pkg.scripts || !(stage in pkg.scripts)) return cb();
  
  // run package lifecycle scripts in the package root, or the nearest parent.
  var d = path.join(npm.dir, pkg.name, pkg.version, "package");
  while (d) {
    try {
      process.chdir(d);
      break;
    } catch (ex) {
      d = path.dirname(d);
    }
  }
  log(stage + ": " + pkg.name+" "+pkg.version, "lifecycle");
  
  // set the env variables, then run the script as a child process.
  // NOTE: The env vars won't work until node supports env hashes for child procs
  var env = makeEnv(pkg);
  env.npm_lifecycle_event = stage;
  
  // support stuff like "make install" or "node test/all.js"
  var args = pkg.scripts[stage].split(/\s/),
    script = args.shift();

  exec(script, args, env, cb);
}

function makeEnv (data, prefix, env_) {
  if (data._lifecycleEnv) return data._lifecycleEnv;
  prefix = prefix || "npm_package_";
  var env = env_ || Object.create(process.env);
  if (!env_) data._lifecycleEnv = env;

  for (var i in data) if (i.charAt(0) !== "_") {
    if (data[i] && typeof(data[i]) === "object") {
      makeEnv(data[i], prefix+i+"_", env);
    } else {
      env[prefix+i] = String(data[i]);
    }
  }
  return env;
}
