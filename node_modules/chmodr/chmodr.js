module.exports = chmodr
chmodr.sync = chmodrSync

var fs = require("fs")
, path = require("path")

function chmodr (p, mode, cb) {
  fs.readdir(p, function (er, children) {
    // any error other than ENOTDIR means it's not readable, or
    // doesn't exist.  give up.
    if (er && er.code !== "ENOTDIR") return cb(er)
    if (er || !children.length) return fs.chmod(p, mode, cb)

    var len = children.length
    , errState = null
    children.forEach(function (child) {
      chmodr(path.resolve(p, child), mode, then)
    })
    function then (er) {
      if (errState) return
      if (er) return cb(errState = er)
      if (-- len === 0) return fs.chmod(p, mode, cb)
    }
  })
}

function chmodrSync (p, mode) {
  var children
  try {
    children = fs.readdirSync(p)
  } catch (er) {
    if (er && er.code === "ENOTDIR") return fs.chmodSync(p, mode)
    throw er
  }
  if (!children.length) return fs.chmodSync(p, mode)

  children.forEach(function (child) {
    chmodrSync(path.resolve(p, child), mode)
  })
  return fs.chmodSync(p, mode)
}
