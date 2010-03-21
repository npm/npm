
var log = require("../utils/log");

module.exports = function exec (cmd, args, env, cb) {
  if (!cb) {
    cb = env;
    env = null;
  }
  log(cmd+" "+args.map(JSON.stringify).join(" "), "exec");
  var cp = require("child_process").spawn(cmd, args, env);
  cp.stdout.addListener("data", function (chunk) {
    if (chunk) process.stdout.write(chunk)
  });
  cp.stderr.addListener("data", function (chunk) {
    if (chunk) process.binding('stdio').writeError(chunk);
  });
  cp.addListener("exit", function (code) {
    if (code) cb(new Error("`"+cmd+"` failed with "+code));
    else cb(null, code);
  });
}
