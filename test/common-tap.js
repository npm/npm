var spawn = require('child_process').spawn

var port = exports.port = 1337
exports.registry = "http://localhost:" + port
process.env.npm_config_loglevel = "error"

exports.run = run
function run (cmd, t, opts, cb) {
  if (!opts)
    opts = {}
  if (!Array.isArray(cmd))
    throw new Error("cmd must be an Array")
  if (!t || !t.end)
    throw new Error("node-tap instance is missing")

  var stdout = ""
    , stderr = ""
    , node = process.execPath
    , child = spawn(node, cmd, opts)

  child.stderr.on("data", function (chunk) {
    stderr += chunk
  })

  child.stdout.on("data", function (chunk) {
    stdout += chunk
  })

  child.on("close", function (code) {
    if (cb)
      cb(t, stdout, stderr, code, { cmd: cmd, opts: opts })
    else
      t.end()
  })
}
