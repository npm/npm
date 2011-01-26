
var log = require("./log")
  , fs = require("./graceful-fs")
  , path = require("path")
  , npm = require("../../npm")
  , exec = require("./exec")
  , uidNumber = require("./uid-number")

module.exports = mkdir
function mkdir (ensure, mode, uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (typeof cb !== "function") cb = mode, mode = 0755

  uidNumber(uid, gid, function (er, uid, gid) {
    if (er) return cb(er)
    mkdir_(ensure, mode, uid, gid, cb)
  })
}

function mkdir_ (ensure, mode, uid, gid, cb) {
  ensure = ensure.replace(/\/+$/, '')
  if (ensure.charAt(0) !== "/") ensure = path.join(process.cwd(), ensure)
  var dirs = ensure.split("/")
    , walker = []
  walker.push(dirs.shift()) // gobble the "/" first
  ;(function S (d) {
    if (d === undefined) {
      // now the directory has been created.
      // chown it to the desired uid/gid
      return fs.chown(ensure, uid, gid, cb)
    }
    walker.push(d)
    var dir = walker.join("/")
    fs.stat(dir, function STATCB (er, s) {
      if (er) {
        fs.mkdir(dir, mode, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // handle stat race
            return fs.stat(dir, STATCB)
          }
          if (er) return cb(er)
          S(dirs.shift())
        })
      } else {
        if (s.isDirectory()) S(dirs.shift())
        else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}
