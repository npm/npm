
module.exports = runScript

var lifecycle = require("./utils/lifecycle")
  , npm = require("../npm")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , chain = require("./utils/chain")
  , fs = require("fs")

runScript.usage = "npm run-script <name>[@<version>] <command>"

runScript.completion = function (args, index, cb) {
  var inst = require("./utils/completion/installed-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , readJson = require("./utils/read-json")

  if (index === 2) return inst(args, index, true, false, cb)


  // get the data about that package.
  var pv = args[0].split("@")
  readJson(path.join(npm.dir, pv[0], pv[1] || "active",
                     "package", "package.json")
          , function (er, data) {
    if (er) return cb(er)
    var cmds = Object.keys(data.scripts || {})
    return cb(null, getCompletions(args[1] || "", cmds))
  })
}

function runScript (args, cb) {
  if (args.length === 1) {
    // run in cwd
    return readJson(path.resolve("package.json"), function (er, pkg) {
      if (er) return cb(runScript.usage)
      thenRun(pkg, process.cwd(), args[0], cb)
    })
  }
  if (args.length !== 2) return cb(runScript.usage)
  var pkg = args[0]
    , cmd = args[1]
    , pv = args[0].split("@")
    , p = pv.shift()
    , v = pv.join("@") || "active"
    , dir = path.join(npm.dir, p, v)
  if (v !== "active") return readThenRun(p, v, cmd, cb)
  fs.readlink(dir, function (er, v) {
    if (er) return cb(er)
    readThenRun(p, v.replace(/^\.\//, ''), cmd, cb)
  })
}

function readThenRun (p, v, cmd, cb) {
  var wd = path.join(npm.dir, p, v, "package")
    , cmds = []
  readJson(path.join(wd, "package.json")
          , {tag:v}
          , function (er, pkg) {
    if (er) return cb(er)
    thenRun(pkg, wd, cmd, cb)
  })
}

function thenRun (pkg, wd, cmd, cb) {
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
