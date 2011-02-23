
// like rm -rf

module.exports = rm

var fs = require("./graceful-fs")
  , path = require("path")
  , sys = require("./sys")
  , failedToRemove = []
  , log = require("./log")
  , constants = require("constants")

process.on("exit", function () {
  if (failedToRemove.length === 0) return
  sys.error("")
  log("The following files and folders could not be removed", "!")
  log("You should remove them manually.", "!")
  sys.error( "\nsudo rm -rf "
           + failedToRemove.map(JSON.stringify).join(" ") )
  failedToRemove.length = 0
})

var waitBusy = {}
  , maxTries = 3
function rm (p, cb_) {

  if (!p) return cb_(new Error("Trying to rm nothing?"))

  function cb (er) {
    if (er) {
      if (er.message.match(/^EBUSY/)) {
        // give it 3 tries
        // windows takes a while to actually remove files from folders,
        // leading to this odd EBUSY error when you try to rm a directory,
        // even if it's actually been emptied.
        if (!waitBusy.hasOwnProperty(p)) waitBusy[p] = maxTries
        if (waitBusy[p]) {
          waitBusy[p] --
          // give it 100 ms more each time.
          var time = (maxTries - waitBusy[p]) * 100
          return setTimeout(function () { rm(p, cb_) }, time)
        }
      }
      failedToRemove.push(p)
      log(p, "rm fail")
      log(er.message, "rm fail")
    } else delete waitBusy[p]
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
