module.exports = exec

var npm = require("./npm.js")
  , output = require("./utils/output.js")

exec.usage = "npm exec\n(add local package binaries to path and execute command)"

function exec (args, cb) {
  var path = require("path")
    , b = npm.bin
    , PATH = (process.env.PATH || "").split(":")
    , exec = require("child_process").exec

  var cmd = "PATH=" + b + ":$PATH " + args.join(" ")
  exec(cmd, function (error, stdout, stderr) {
    output.write(stdout, function (er) { cb(er, stdout) })
  })
}
