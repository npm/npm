// npm edit <pkg>[@<version>]
// open the package folder in the $EDITOR

module.exports = edit
edit.usage = "npm edit <pkg>"

edit.completion = function (args, index, cb) {
  var installedPkgs = require("./utils/completion/installed-packages")
  installedPkgs(args, index, true, false, cb)
}

var npm = require("../npm")
  , exec = require("./utils/exec")
  , path = require("path")
  , fs = require("./utils/graceful-fs")

function edit (args, cb) {
  var p = args[0]
  if (args.length !== 1 || !p) return cb(edit.usage)
  var editor = npm.config.get("editor")
  if (!editor) return cb(new Error(
    "No editor set.  Set the 'editor' config, or $EDITOR environ."))
  fs.lstat(path.resolve(npm.dir, p), function (er) {
    if (er) return cb(er)
    exec(editor, [path.resolve(npm.dir, p)], function (er) {
      if (er) return cb(er)
      npm.commands.rebuild(args, cb)
    })
  })
}
