// npm edit <pkg>[@<version>]
// open the package folder in the $EDITOR

module.exports = edit
edit.usage = "npm edit <pkg>"

edit.completion = require("./utils/completion/installed-shallow")

var npm = require("../npm")
  , exec = require("./utils/exec")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , log = require("./utils/log")

function edit (args, cb) {
  var p = args[0]
  if (args.length !== 1 || !p) return cb(edit.usage)
  var editor = npm.config.get("editor")
  if (!editor) return cb(new Error(
    "No editor set.  Set the 'editor' config, or $EDITOR environ."))
  p = p.split("/")
       .join("/node_modules/")
       .replace(/(\/node_modules)+/, "/node_modules")
  fs.lstat(path.resolve(npm.dir, p), function (er) {
    if (er) return cb(er)
    exec(editor, [path.resolve(npm.dir, p)], function (er) {
      if (er) return cb(er)
      npm.commands.rebuild(args, cb)
    })
  })
}
