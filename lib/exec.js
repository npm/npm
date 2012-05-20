module.exports = exec

var npm = require("./npm.js")
  , output = require("./utils/output.js")
  , cp = require("child_process")
  , os = require("os")

exec.usage = "npm exec <command>\n(execute command using local package bin)"

exec.completion = require("./utils/completion/local-bin.js")

function exec (args, cb) {
  var b = npm.bin, cmd

  if (args.length == 0) return cb("Usage:\n"+exec.usage)
  var cmd;
  if (process.platform.match(/win/))
    cmd = "SET OLDPATH=%PATH% & SET PATH=" + b + ";%PATH% & " +
      args.join(" ") + " & SET PATH=%OLDPATH%"
  else
    cmd = "PATH=" + b + ":$PATH " + args.join(" ")    
  cp.exec(cmd, function (error, stdout, stderr) {
    if (error !== null) return cb(stderr.replace(/\n$/, ''))
    var o = stdout.replace(/\n$/, '')
    output.write(o, function (er) { cb(er, o) })
  })
}
