
var fs = require("fs")
  , path = require("path")
  , exec = require("./utils/exec")

module.exports = help

function help (args, cb) {
  var section = args.shift() || "help"
  fs.stat(path.join(__dirname, "../man/"+section+".1"), function (e, o) {
    if (e) return cb(new Error("Help section not found: "+section))
    exec("man", [path.join(__dirname, "../man/"+section+".1")], cb)
  })
}
