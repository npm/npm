
module.exports = exec
exec.spawn = spawn
exec.pipe = pipe

var log = require("./log")
  , child_process = require("child_process")
  , sys = require("./sys")
  , npm = require("../../npm")

function exec (cmd, args, env, takeOver, cwd, uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = cwd, cwd = process.cwd()
  if (typeof cb !== "function") cb = takeOver, takeOver = true
  if (typeof cb !== "function") cb = env, env = process.env
  gid = gid == null ? process.getgid() : gid
  uid = uid == null ? process.getuid() : uid
  log.silly(cmd+" "+args.map(JSON.stringify).join(" "), "exec")
  var stdout = ""
    , stderr = ""
    , cp = spawn(cmd, args, env, takeOver, cwd, uid, gid)
  cp.stdout && cp.stdout.on("data", function (chunk) {
    if (chunk) stdout += chunk
  })
  cp.stderr && cp.stderr.on("data", function (chunk) {
    if (chunk) stderr += chunk
  })
  cp.on("exit", function (code) {
    var er = null
    if (code) er = new Error("`"+cmd+"` failed with "+code)
    cb(er, code, stdout, stderr)
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
    if (!code) return log.verbose(cp1.name || "<unknown>", "success")
    cp2.kill()
    cb(errState = new Error(
      "Failed "+(cp1.name || "<unknown>")+"\nexited with "+code))
  })
  cp2.on("exit", function (code) {
    if (errState) return
    if (!code) return log.verbose(cp2.name || "<unknown>", "success", cb)
    cb(new Error( "Failed "+(cp2.name || "<unknown>")+"\nexited with "+code))
  })
}

function spawn (c, a, env, takeOver, cwd, uid, gid) {
  var stdio = process.binding("stdio")
    , fds = [ stdio.stdinFD || 0
            , stdio.stdoutFD || 1
            , stdio.stderrFD || 2
            ]
    , opts = { customFds : takeOver ? fds : [-1,-1,-1]
             , env : env || process.env
             , cwd : cwd || process.cwd()
             }
    , cp
  if (uid != null) opts.uid = uid
  if (gid != null) opts.gid = gid
  if (!isNaN(opts.uid)) opts.uid = +opts.uid
  if (!isNaN(opts.gid)) opts.gid = +opts.gid
  log.warn([c, a, opts.uid, opts.gid], "spawn")
  cp = child_process.spawn(c, a, opts)
  cp.name = c +" "+ a.map(JSON.stringify).join(" ")
  return cp
}
