module.exports = exec

var fs = require("fs")
var npm = require("./npm.js")
var exec = require("child_process").exec
var path = require("path")

exec.usage = "npm exec <cmd> [args]\nnpm exec -g <cmd> [args]"

function exec (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  var b = npm.bin
    , PATH = (process.env.PATH || "").split(":")
    , cmd = args[0] || ""
    , executable = path.join(b, cmd)

  if (!cmd) {
    return cb("Usage: " + exec.usage)
  } else if (!fs.existsSync(executable)) {
    return cb("Invalid command: " + cmd)
  } else {
    exec(args.join(' '), function (err, stdout, stderr) {
      if (err) {
        err = err.message.replace("Command failed: ", "")
      }
      if (!silent) {
        process.stdout.write(stdout)
        // process.stderr.write(stderr)
      }
      process.nextTick(cb.bind(this, err, stdout))
    })
  }

  if (npm.config.get("global") && PATH.indexOf(b) === -1) {
    npm.config.get("logstream").write("(not in PATH env variable)\n")
  }
}
