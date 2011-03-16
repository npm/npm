// npm edit <pkg>[@<version>]
// open the package folder in the $EDITOR

module.exports = edit
edit.usage = "npm edit <pkg>"

edit.completion = function (opts, cb) {
  var conf = opts.conf
    , args = conf.argv.remain
  if (args.length > 3) return cb()
  var local
    , global
    , localDir = npm.dir
    , globalDir = path.join(npm.config.get("prefix"), "node_modules")
  if (npm.config.get("global")) local = [], next()
  else fs.readdir(localDir, function (er, pkgs) {
    local = (pkgs || []).filter(function (p) {
      return p.charAt(0) !== "."
    })
    next()
  })
  fs.readdir(globalDir, function (er, pkgs) {
    global = (pkgs || []).filter(function (p) {
      return p.charAt(0) !== "."
    })
    next()
  })
  function next () {
    if (!local || !global) return
    if (!npm.config.get("global")) {
      global = global.map(function (g) {
        return [g, "-g"]
      })
    }
    return cb(null, local.concat(global))
  }
}

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
  fs.lstat(path.resolve(npm.dir, p), function (er) {
    if (er) return cb(er)
    exec(editor, [path.resolve(npm.dir, p)], function (er) {
      if (er) return cb(er)
      npm.commands.rebuild(args, cb)
    })
  })
}
