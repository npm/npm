module.exports = uidNumber

var exec = require("./exec")
  , path = require("path")
  , log = require("./log")

function uidNumber (uid, gid, cb) {
  if (typeof cb !== "function") cb = gid, gid = null
  if (typeof cb !== "function") cb = uid, uid = null
  if (gid == null) gid = process.getgid()
  if (uid == null) uid = process.getuid()
  if (!isNaN(gid)) gid = +gid
  if (!isNaN(uid)) uid = +uid
  if (typeof gid === "number" && typeof uid === "number") {
    return cb(null, uid, gid)
  }
  var getter = path.join(__dirname, "..", "..", "bin", "npm-get-uid-gid.js")
  return exec( process.execPath, [getter, uid, gid], process.env, false
             , process.cwd(), process.getuid(), process.getgid()
             , function (er, code, out, err) {
    if (er) return log.er(cb, "Could not get uid/gid "+err)(er)
    log.silly(out, "output from getuid/gid")
    out = JSON.parse(out+"")
    if (isNaN(out.uid) || isNaN(out.gid)) return cb(new Error(
      "Could not get uid/gid: "+JSON.stringify(out)))
    cb(null, out.uid, out.gid)
  })
}
