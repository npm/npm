
var log = require("./log")
  , fs = require("./graceful-fs")
  , path = require("path")
  , npm = require("../../npm")
  , exec = require("./exec")

module.exports = mkdir
function mkdir (ensure, uid, gid, cb) {
  if (!cb) cb = gid, gid = null
  if (!cb) cb = uid, uid = null
  uid = uid || npm.config.get("operator")
  gid = gid || npm.config.get("group")
  log.silly([ensure, uid, gid], "mkdir")

  // chown *only* takes numeric uid/gid
  if (!isNaN(uid)) uid = +uid
  if (!isNaN(gid)) gid = +gid
  if (isNaN(uid) || isNaN(gid)) {
    log.verbose([uid, gid], "Getting numeric uid,gid for mkdir")
    var getter = path.join(__dirname, "../../bin/npm-get-uid-gid.js")
    return exec( "node", [getter, uid, gid], process.env, false
               , process.cwd(), process.getuid(), process.getgid()
               , function (er, code, out, err) {
      if (er) return log.er(cb, "Could not set uid/gid "+err)(er)
      log.silly(out, "output from getuid/gid")
      out = JSON.parse(out+"")
      if (isNaN(out.uid) || isNaN(out.gid)) return cb(new Error(
        "mkdir: Could not get uid/gid: "+JSON.stringify(out)))
      mkdir(ensure, out.uid, out.gid, cb)
    })
  }
  log.verbose([uid, gid], "mkdir uid,gid")


  ensure = ensure.replace(/\/+$/, '')
  if (ensure.charAt(0) !== "/") ensure = path.join(process.cwd(), ensure)
  var dirs = ensure.split("/")
    , walker = []
    , chmod = 0755
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
        fs.mkdir(dir, chmod, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // handle stat race
            return fs.stat(dir, STATCB)
          }
          if (er) return cb(er)
          fs.chown(dir, uid, gid, function (er) {
            if (er) return log.er(cb,
              "Couldn't chown "+dir)(er)
            S(dirs.shift())
          })
        })
      } else {
        if (s.isDirectory()) S(dirs.shift())
        else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}
