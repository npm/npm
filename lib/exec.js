module.exports = exec

var npm = require("./npm.js")
  , output = require("./utils/output.js")

exec.usage = "npm exec <command>\n(execute command using local package bin)"

exec.completion = require("./utils/completion/local-bin.js")

function exec (args, cb) {
  var b = npm.bin
    , exec = require("child_process").exec

  if (args.length == 0) return cb("Usage:\n"+exec.usage)
  var cmd = "PATH=" + b + ":$PATH " + args.join(" ")
  exec(cmd, function (error, stdout, stderr) {
    if (error !== null) return cb(stderr.replace(/\n$/, ''))
    var o = stdout.replace(/\n$/, '')
    output.write(o, function (er) { cb(er, o) })
  })
}
