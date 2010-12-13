module.exports = which
which.sync = whichSync

var path = require("path")
  , fs = require("fs")

// console.log(process.execPath)
// console.log(process.argv)

function isExe (mod, uid, gid) {
  return (mod & 0001)
      || (mod & 0010) && gid === process.getgid()
      || (mod & 0100) && uid === process.getuid()
}
function which (cmd, cb) {
  if (cmd.charAt(0) === "/") return cb(null, cmd)
  var pathEnv = (process.env.PATH || "").split(":")
  ;(function F (i) {
    var p = path.join(pathEnv[i], cmd)
    fs.stat(p, function (er, stat) {
      if (stat && isExe(stat.mode, stat.uid, stat.gid)) {
        return cb(null, p)
      }
      if (i === l) return cb(new Error("not found: "+cmd))
      return F(i+1, l)
    })
  })(0, pathEnv.length)
}


function whichSync (cmd) {
  if (cmd.charAt(0) === "/") return cmd
  var pathEnv = (process.env.PATH || "").split(":")
  for (var i = 0, l = pathEnv.length; i < l; i ++) {
    var p = path.join(pathEnv[i], cmd)
    var stat
    try { stat = fs.statSync(p) } catch (ex) {}
    if (stat && isExe(stat.mode, stat.uid, stat.gid)) return p
  }
  throw new Error("not found: "+cmd)
}
