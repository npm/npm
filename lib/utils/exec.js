
var log = require("../utils/log")

module.exports = function exec (cmd, args, env, pipe, cb) {
  if (!cb) cb = pipe, pipe = false
  if (!cb) cb = env, env = null
  log(cmd+" "+args.map(JSON.stringify).join(" "), "exec")
  var stdio = process.binding("stdio")
    , fds = [ stdio.stdinFD || 0
            , stdio.stdoutFD || 1
            , stdio.stderrFD || 2
            ]
    , cp = require("child_process").spawn( cmd
                                         , args
                                         , env
                                         , pipe ? null : fds
                                         )
    , stdout = ""
    , stderr = ""
  cp.stdout && cp.stdout.on("data", function (chunk) {
    if (chunk) stdout += chunk
  })
  cp.stderr && cp.stderr.on("data", function (chunk) {
    if (chunk) stderr += chunk
  })
  cp.on("exit", function (code) {
    if (code) cb(new Error("`"+cmd+"` failed with "+code))
    else cb(null, code, stdout, stderr)
  })
  return cp
}
