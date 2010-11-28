// npm edit <pkg>[@<version>]
// open the package folder in the $EDITOR

module.exports = edit
edit.usage = "npm edit <pkg>[@<version>]"

edit.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, false, cb)
}

var npm = require("../npm")
  , exec = require("./utils/exec")
  , path = require("path")

function edit (args, cb) {
  var p = args[0]
  if (args.length !== 1 || !p) return cb(edit.usage)
  p = p.split("@")
  var editor = npm.config.get("editor")
    , n = p.shift()
    , v = p.join("@") || "active"
  if (!editor) return cb(new Error(
    "No editor set.  Set the 'editor' config, or $EDITOR environ."))
  exec(editor, [path.join(npm.dir, n, v, "package")], function (er) {
    if (er) return cb(er)
    npm.commands.rebuild(args, cb)
  })
}
