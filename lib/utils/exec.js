
var log = require("../utils/log");

module.exports = function exec (cmd, args, env, cb) {
  if (!cb) cb = env, env = null
  log(cmd+" "+args.map(JSON.stringify).join(" "), "exec")
  var cp = require("child_process").spawn(cmd, args, env)
    , stdout = ""
    , stderr = ""
  cp.stdout.addListener("data", function (chunk) {
    if (chunk) {
      process.stdout.write(chunk)
      stdout += chunk
    }
  });
  cp.stderr.addListener("data", function (chunk) {
    if (chunk) {
      process.binding('stdio').writeError(chunk)
      stderr += chunk
    }
  });
  cp.addListener("exit", function (code) {
    if (code) cb(new Error("`"+cmd+"` failed with "+code))
    else cb(null, code, stdout, stderr)
  });
}
