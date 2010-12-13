
module.exports = runScript

var lifecycle = require("./utils/lifecycle")
  , npm = require("../npm")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , chain = require("./utils/chain")

runScript.usage = "npm run-script <name>[@<version>] <command>"

runScript.completion = function (args, index, cb) {
  var inst = require("./utils/completion/installed-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , readJson = require("./utils/read-json")

  if (index === 2) return inst(args, index, true, false, cb)


  // get the data about that package.
  var pv = args[0].split("@")
  readJson(path.join(npm.dir, pv[0], pv[1] || "active", "package", "package.json")
          , function (er, data) {
    if (er) return cb(er)
    var cmds = Object.keys(data.scripts || {})
    return cb(null, getCompletions(args[1] || "", cmds))
  })
}

function runScript (args, cb) {
  if (args.length !== 2) return cb(runScript.usage)
  var pkg = args[0]
    , cmd = args[1]
    , pv = args[0].split("@")
    , p = pv.shift()
    , v = pv.join("@") || "active"
    , cmds = []
    , wd = path.join(npm.dir, p,v, "package")
  readJson(path.join(wd, "package.json")
          , function (er, pkg) {
    if (er) return cb(er)
    if (!pkg.scripts) pkg.scripts = {}
    if (cmd === "restart" && !pkg.scripts.restart) {
      cmds = ["prestop","stop","poststop","prestart"
             ,"start","poststart"]
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
  })
}
