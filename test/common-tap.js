var spawn = require('child_process').spawn

var port = exports.port = 1337
exports.registry = "http://localhost:" + port

exports.run = run
function run (cmd, t, opts, cb) {
  if (!opts)
    opts = {}
  if (!Array.isArray(cmd))
    throw new Error("cmd must be an Array")
  if (!t || !t.end)
    throw new Error("node-tap instance is missing")

  var c = ""
    , e = ""
    , node = process.execPath
    , child = spawn(node, cmd, opts)

  child.stderr.on("data", function (chunk) {
    e += chunk
  })

  child.stdout.on("data", function (chunk) {
    c += chunk
  })

  child.stdout.on("end", function () {
    if (cb)
      cb(t, c, e, { cmd: cmd, opts: opts })
    else
      t.end()
  })
}
