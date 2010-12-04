// npm expore <pkg>[@<version>]
// open a subshell to the package folder.

module.exports = explore
explore.usage = "npm explore <pkg>[@<version>]"
explore.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, false, cb)
}

var npm = require("../npm")
  , exec = require("./utils/exec")
  , path = require("path")

function explore (args, cb) {
  var p = args[0]
  if (args.length !== 1 || !p) return cb(edit.usage)
  p = p.split("@")
  var editor = npm.config.get("editor")
    , n = p.shift()
    , v = p.join("@") || "active"
  console.log("Type 'exit' or ^D when finished")
  exec("bash", [], null, true, path.join(npm.dir, n, v, "package"), cb)
}
