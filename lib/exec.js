module.exports = exec

var npm = require("./npm.js")
  , output = require("./utils/output.js")
  , cp = require("child_process")
  , os = require("os")

exec.usage = "npm exec <command>\n(execute command using local package bin)"

exec.completion = require("./utils/completion/local-bin.js")

function exec(args, cb) {
  if (args.length == 0) return cb("Usage:\n"+exec.usage)
  var b = npm.bin, cmd, o = ""
  var isWin = process.platform.match(/win/)

  // Create an OS specific call
  if (isWin)
    cmd = "SET OLDPATH=%PATH% & SET PATH=" + b + ";%PATH% & " +
      args.join(" ") + " & SET PATH=%OLDPATH%"
  else
    cmd = "PATH=" + b + ":$PATH " + args.join(" ")

  p = cp.exec(cmd, function(error, stdout, stderr) {
    // Return all captured output
    cb(null, o)
  })
  p.stdout.on('data', function(data) {
    // Capture stdout output and output to screen
    console.log(data.toString().replace(/\n$/, ''))
    o += data.toString()
  })
  p.stderr.on('data', function(data) {
    // Capture stderr output and output to screen
    console.error(data.toString().replace(/\n$/, ''))
    o += data.toString()
  })
}
