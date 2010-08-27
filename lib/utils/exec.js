
module.exports = exec
exec.spawn = spawn
exec.pipe = pipe

var log = require("../utils/log")
  , child_process = require("child_process")
  , sys = require("sys")

function exec (cmd, args, env, takeOver, cb) {
  if (!cb) cb = takeOver, takeOver = true
  if (!cb) cb = env, env = process.env
  log.verbose(cmd+" "+args.map(JSON.stringify).join(" "), "exec")
  var stdout = ""
    , stderr = ""
    , cp = spawn(cmd, args, env, takeOver)
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

function logger (d) { if (d) process.binding("stdio").writeError(d+"") }
function pipe (cp1, cp2, cb) {
  sys.pump(cp1.stdout, cp2.stdin)
  var errState = null
  if (log.level <= log.LEVEL.silly) {
    cp1.stderr.on("data", logger)
    cp2.stderr.on("data", logger)
  }
  cp1.on("exit", function (code) {
    if (!code) return log.verbose(cp2.name || "<unknown>", "success")
    cp2.kill()
    cb(errState = new Error(
      "Failed "+(cp1.name || "<unknown>")+"\nexited with "+code))
  })
  cp2.on("exit", function (code) {
    if (errState) return
    if (!code) return log.verbose(cp1.name || "<unknown>", "success", cb)
    cb(new Error( "Failed "+(cp2.name || "<unknown>")+"\nexited with "+code))
  })
}

function spawn (c, a, env, takeOver) {
  var stdio = process.binding("stdio")
    , fds = [ stdio.stdinFD || 0
            , stdio.stdoutFD || 1
            , stdio.stderrFD || 2
            ]
    , cp = child_process.spawn( c
                              , a
                              , env
                              , takeOver ? fds : null
                              )
  cp.name = c +" "+ a.map(JSON.stringify).join(" ")
  return cp
}
