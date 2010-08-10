
module.exports = repl

function repl (args, cb) {
  var repl = require("repl")
    , npm = require("../npm")
    , ctx = repl.start("npm> ").context
    , log = require("./utils/log")
  process.env.NODE_NO_READLINE = 1
  // log(npm.commands)
  for (var i in npm.commands) {
    // log(i, "repl")
    ctx[i] = function () {
      npm.commands[i]( Array.prototype.slice.call(arguments)
                     , function (er) { log(er, i) }
                     )
    }
  }
}
