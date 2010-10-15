
var log = require("../utils/log")
  , fs = require("./graceful-fs")
  , path = require("path")

module.exports = mkdir
function mkdir (ensure, chmod, cb) {
  ensure = ensure.replace(/\/+$/, '')
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
    fs.stat(dir, function STATCB (er, s) {
      if (er) {
        fs.mkdir(dir, chmod, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // When multiple concurrent actors are trying to ensure the same directories,
            // it can sometimes happen that something doesn't exist when you do the stat,
            // and then DOES exist when you try to mkdir.  In this case, just go back to
            // the stat to make sure it's a dir and not a file.
            return fs.stat(dir, STATCB)
          }
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
