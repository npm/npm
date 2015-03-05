
module.exports = link
link.ifExists = linkIfExists
link.getTypes = getTypes

var fs = require("graceful-fs")
  , chain = require("slide").chain
  , mkdir = require("mkdirp")
  , rm = require("./gently-rm.js")
  , path = require("path")
  , npm = require("../npm.js")

function linkIfExists (from, to, gently, cb) {
  fs.stat(from, function (er) {
    if (er) return cb()
    link(from, to, gently, cb)
  })
}

function link (from, to, gently, cb) {
  if (typeof cb !== "function") cb = gently, gently = null
  if (npm.config.get("force")) gently = false

  to = path.resolve(to)
  var target = from = path.resolve(from)
  if (process.platform !== "win32") {
    // junctions on windows must be absolute
    target = path.relative(path.dirname(to), from)
    // if there is no folder in common, then it will be much
    // longer, and using a relative link is dumb.
    if (target.length >= from.length) target = from
  }

  chain
    ( [ [fs, "stat", from]
      , [rm, to, gently]
      , [mkdir, path.dirname(to)]
      , [fs, "symlink", target, to, "junction"] ]
    , cb)
}

function getTypes ( platform, type  ) {
  var isWin = platform === 'win32'
    , link
    , shim
    
    switch (type) {
      default: 
      case "auto": 
        link = !isWin
        shim = isWin
        break
      case "unix":
        link = true
        shim = false
        break
      case "win":
        link = false
        shim = true
        break
      case "both":
        link = shim = true
        break
    }
    
  return {
    link: link,
    shim: shim
  }
}
