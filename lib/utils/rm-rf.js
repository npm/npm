
// like rm -rf

module.exports = rm

var fs = require("./graceful-fs")
  , path = require("path")
  , failedToRemove = []
  , log = require("./log")
  , constants = require("constants")

process.on("exit", function () {
  if (failedToRemove.length === 0) return
  console.error("The following files couldn't be removed.")
  console.error("Remove them manually and try again")
  console.error( "\nsudo rm -rf "
           + failedToRemove.map(JSON.stringify).join(" ") +"\n")
  failedToRemove.length = 0
})

var waitBusy = {}
  , maxTries = 3
function rm (p, gently, cb_) {

  if (typeof cb_ !== "function") cb_ = gently, gently = false

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
          return setTimeout(function () { rm(p, gently, cb_) }, time)
        }
      } else if (er.errno === constants.EEXIST && er.path) return cb_(er)
      failedToRemove.push(p)
      log(p, "rm fail")
      log(er.message, "rm fail")
    } else delete waitBusy[p]
    cb_(null, er)
  }

  fs.lstat(p, function (er, s) {
    if (er) return cb()
    if (gently) return clobberTest(p, s, gently, cb)
    rm_(p, s, cb)
  })
}

function clobberFail (p, cb) {
  var er = new Error("Refusing to delete non-npm file (override with --force)")
  er.errno = constants.EEXIST
  er.path = p
  return cb(er)
}

function realish (p, cb) {
  fs.readlink(p, function (er, r) {
    if (er) return cb(er)
    return cb(null, path.resolve(path.dirname(p), r))
  })
}

function clobberTest (p, s, gently, cb) {
  if (!s.isSymbolicLink()) {
    p = path.resolve(p)
    if (p.indexOf(gently) !== 0) return clobberFail(p, cb)
    else return rm_(p, s, cb)
  }
  realish(p, function (er, rp) {
    if (er) return rm_(p, s, cb)
    if (rp.indexOf(gently) !== 0) return clobberFail(p, cb)
    else return rm_(p, s, cb)
  })
}

function rm_ (p, s, cb) {
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
}
