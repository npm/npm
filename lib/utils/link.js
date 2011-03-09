
module.exports = link
link.ifExists = linkIfExists

var fs = require("./graceful-fs")
  , chain = require("./chain")
  , mkdir = require("./mkdir-p")
  , rm = require("./rm-rf")
  , log = require("./log")
  , path = require("path")
  , relativize = require("./relativize")

function linkIfExists (from, to, gently, cb) {
  fs.stat(from, function (er) {
    if (er) return cb()
    link(from, to, gently, cb)
  })
}

function link (from, to, gently, cb) {
  console.error("link: %j", [from, to, gently])
  chain
    ( [fs, "stat", from]
    , [rm, to, gently]
    , [function () { console.error("made it past the rm?") }]
    , [mkdir, path.dirname(to)]
    , [fs, "symlink", relativize(from, to), to]
    //, log.er(cb, "linking "+from+" to "+to, "failed")
    , function (er) {
      if (er) console.error("link fail: "+er.path)
      cb(er)
    }
    )
}
