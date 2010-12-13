
module.exports = runScript

var lifecycle = require("./utils/lifecycle")
  , npm = require("../npm")

runScript.usage = "npm run-script <name>[@<version>] <command>"

runScript.completion = function (args, index, cb) {
  var inst = require("./utils/completion/installed-packages")
    , getCompletions = require("./utils/completion/get-completions")
    , path = require("path")
    , readJson = require("./utils/read-json")

  if (index === 2) return inst(args, index, true, false, cb)

  // get the data about that package.
  var pv = args[1].split("@")
  readJson(path.join(npm.dir, pv[0], pv[1], "package", "package.json")
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
  if (cmd === "restart") return npm.commands.restart([pkg], cb)
  return lifecycle.cmd(cmd)([pkg], cb)
}
