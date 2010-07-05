
var npm = require("../npm")
  , sys = require("sys")
  , fs = require("fs")
  , path = require("path")
  , exec = require("./utils/exec")

// If unknown, the command is "help"
// then shell to man

module.exports = help

function help (args, cb) {
  var command = args.shift()
  fs.stat(path.join(__dirname, "../man/"+command+".1"), function (e, o) {
    if (e) {
      sys.error("command not found: "+command)
      command = "help"
    }
    exec("man", [path.join(__dirname, "../man/"+command+".1")], function () {
      process.stdout.flush()
      cb()
    })
  })
}
