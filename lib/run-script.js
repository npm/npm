
module.exports = runScript

var lifecycle = require("./utils/lifecycle")
  , npm = require("../npm")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , chain = require("./utils/chain")
  , fs = require("./utils/graceful-fs")

runScript.usage = "npm run-script [<pkg>] <command>"

runScript.completion = function (args, index, cb) {
  var inst = require("./utils/completion/installed-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , readJson = require("./utils/read-json")

  if (index === 2) return inst(args, index, true, false, cb)

  // get the data about that package.
  var pv = args[0]
  readJson(path.join(npm.dir, pv, "package.json")
          , function (er, data) {
    if (er) return cb(er)
    var cmds = Object.keys(data.scripts || {})
    return cb(null, getCompletions(args[1] || "", cmds))
  })
}

function runScript (args, cb) {
  var pkgdir = args.length === 1 ? process.cwd()
             : path.resolve(npm.dir, args.shift())
    , cmd = args.pop()
  readJson(path.resolve(pkgdir, "package.json"), function (er, d) {
    if (er) return cb(er)
    run(d, pkgdir, cmd, cb)
  })
}

function run (pkg, wd, cmd, cb) {
  var cmds = []
  if (!pkg.scripts) pkg.scripts = {}
  if (cmd === "restart") {
    cmds = ["prestop","stop","poststop"
           ,"restart"
           ,"prestart","start","poststart"]
  } else {
    cmds = [cmd]
  }
  if (!cmd.match(/^(pre|post)/)) {
    cmds = ["pre"+cmd].concat(cmds).concat("post"+cmd)
  }
  log.verbose(cmds, "run-script")
  chain(cmds.map(function (c) {
    return [lifecycle, pkg, c, wd]
  }).concat(cb))
}
