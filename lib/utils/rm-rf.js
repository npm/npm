
// like rm -rf

module.exports = rm

var fs = require("./graceful-fs")
  , path = require("path")
  , sys = require("sys")
  , failedToRemove = []
  , log = require("./log")

process.on("exit", function () {
  if (failedToRemove.length === 0) return
  sys.error("")
  log("The following files and folders could not be removed", "!")
  log("You should remove them manually.", "!")
  sys.error( "\nsudo rm -rf "
           + failedToRemove.map(JSON.stringify).join(" ")
           )
})

function rm (p, cb_) {

  if (!p) return cb(new Error("Trying to rm nothing?"))

  var cb = function (er) {
    if (er) {
      failedToRemove.push(p)
      log(p, "rm fail")
      log(er.message, "rm fail")
    }
    cb_(null, er)
  }

  fs.lstat(p, function (er, s) {
    if (er) return cb()
    if (s.isFile() || s.isSymbolicLink()) {
      fs.unlink(p, cb)
    } else {
      fs.readdir(p, function (er, files) {
        if (er) return cb(er)
        ;(function rmFile (f) {
          if (!f) fs.rmdir(p, cb)
          else rm(path.join(p, f), function (_, er) {
            if (er) return cb(er)
            rmFile(files.pop())
          })
        })(files.pop())
      })
    }
  })
}
