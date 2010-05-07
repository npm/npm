
var log = require("../utils/log")
  , fs = require("fs")
  , path = require("path")

module.exports = mkdir
function mkdir (ensure, chmod, cb) {
  if (ensure.charAt(0) !== "/") ensure = path.join(process.cwd(), ensure)
  var dirs = ensure.split("/")
    , walker = []
  if (arguments.length < 3) {
    cb = chmod
    chmod = 0755
  }
  walker.push(dirs.shift()) // gobble the "/" first
  ;(function S (d) {
    if (d === undefined) return cb()
    walker.push(d)
    var dir = walker.join("/")
    fs.stat(dir, function (er, s) {
      if (er) {
        fs.mkdir(dir, chmod, function (er, s) {
          if (er) return cb(new Error(
            "Failed to make "+dir+" while ensuring "+ensure+"\n"+er.message))
          S(dirs.shift())
        })
      } else {
        if (s.isDirectory()) S(dirs.shift())
        else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}
