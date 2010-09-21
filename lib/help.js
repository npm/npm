
var fs = require("./utils/graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec")

module.exports = help

function help (args, cb) {
  var section = args.shift() || "help"
  fs.stat(path.join(__dirname, "../man1/"+section+".1"), function (e, o) {
    if (e) return cb(new Error("Help section not found: "+section))
    // function exec (cmd, args, env, takeOver, cb) {
    var manpath = path.join(__dirname, "..")
      , env = {}
    Object.keys(process.env).forEach(function (i) { env[i] = process.env[i] })
    env.MANPATH = manpath
    exec("man", [section], env, true, cb)
  })
}
