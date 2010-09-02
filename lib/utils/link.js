
module.exports = link
link.ifExists = linkIfExists

var fs = require("./graceful-fs")
  , chain = require("./chain")
  , mkdir = require("./mkdir-p")
  , rm = require("./rm-rf")
  , log = require("./log")
  , path = require("path")
  , relativize = require("./relativize")

function linkIfExists (from, to, cb) {
  fs.stat(from, function (er) {
    if (er) return cb()
    link(from, to, cb)
  })
}

function link (from, to, cb) {
  chain
    ( [fs, "stat", from]
    , [rm, to]
    , [mkdir, path.dirname(to)]
    , [fs, "symlink", relativize(from, to), to]
    , log.er(cb, "linking "+from+" to "+to, "failed")
    )
}
