
module.exports = lifecycle;

var log = require("../utils").log,
  exec = require("../utils/exec"),
  npm = require("../../npm"),
  path = require("path");

function lifecycle (pkg, stage, cb) {
  while (pkg && pkg.data) pkg = pkg.data;
  if (!pkg) return cb(new Error("Invalid package data"));
  if (!pkg.scripts || !(stage in pkg.scripts)) return cb();
  
  // run package lifecycle scripts in the package root, or the nearest parent.
  var d = path.join(npm.dir, pkg.name, pkg.version, "package/x");
  while (d) {
    d = path.dirname(d);
    try {
      process.chdir(d);
      break;
    } catch (ex) {}
  }
      
  
  log(stage + ": " + pkg, "lifecycle");
  
  // set the env variables, then run the script as a child process.
  var env = makeEnv(pkg);
  for (var i in env) log("env."+i+"="+JSON.stringify(env[i]), "lifecycle");
  exec(pkg.scripts[stage], [], env, cb);
}

function makeEnv (data, prefix) {
  if (data._lifecycleEnv) return data._lifecycleEnv;
  prefix = prefix || "npm_package_";
  var env = data._lifecycleEnv = {};
  for (var i in data) if (i.charAt(0) !== "_") {
    env[prefix+i] = (data[i] && typeof(data[i]) === "object")
      ? makeEnv(data[i], prefix+i+"_")
      : env[prefix+i] = String(data[i]);
  }
  return env;
}
