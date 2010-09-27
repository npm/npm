
var fs = require("./utils/graceful-fs")
  , path = require("path")
  , exec = require("./utils/exec")
  , npm = require("../npm")

module.exports = help

function help (args, cb) {
  var section = args.shift() || "help"
    , section_path = path.join(__dirname, "../man1/"+section+".1")
  fs.stat(section_path, function (e, o) {
    if (e) return cb(new Error("Help section not found: "+section))
    // function exec (cmd, args, env, takeOver, cb) {
    var manpath = path.join(__dirname, "..")
      , env = {}
    Object.keys(process.env).forEach(function (i) { env[i] = process.env[i] })
    env.MANPATH = manpath
    var pager = npm.config.get("pager")
    switch (pager){
      case "woman":
        exec("emacsclient", ["-e", "(woman-find-file \"" + section_path + "\")"], env, true, cb)
        break
      default:
        exec("man", [section], env, true, cb)
    }
  })
}
