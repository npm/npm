// npm expore <pkg>[@<version>]
// open a subshell to the package folder.

module.exports = explore
explore.usage = "npm explore <pkg>[@<version>] [<cmd>]"
explore.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, false, cb)
}

var npm = require("../npm")
  , exec = require("./utils/exec")
  , path = require("path")
  , fs = require("fs")

function explore (args, cb) {
  if (args.length < 1 || !args[0]) return cb(explore.usage)
  var p = args.shift()
  args = args.join(" ").trim()
  if (args) args = ["-c", args]
  else args = []
  p = p.split("@")
  var editor = npm.config.get("editor")
    , n = p.shift()
    , v = p.join("@") || "active"
    , cwd = path.join(npm.dir, n, v, "package")
  fs.stat(cwd, function (er, s) {
    if (er || !s.isDirectory()) return cb(new Error(
      "It doesn't look like "+n+"@"+v+" is installed."))
    if (!args.length) console.log(
      "\nExploring "+cwd+"\n"+
      "Type 'exit' or ^D when finished\n")
    exec("bash", args, null, true, cwd, function (er) {
      // only fail if non-interactive.
      if (!args.length) return cb()
      cb(er)
    })
  })
}
