
// link the supplied folder to .npm/{name}/{version}/package

var npm = require("../npm")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , fs = require("fs")
  , readJson = require("./utils/read-json")
  , rm = require("./utils/rm-rf")
  , mkdir = require("./utils/mkdir-p")
  , path = require("path")
  , crypto

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}

module.exports = link

function link (args, cb) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the link feature"))
  var folder = args.shift() || "."
  // folder's root MUST contain a package.json
  // read that for package info, then link it in, clobbering if necessary.
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  var jsonFile = path.join(folder, "package.json")
    , pkg = {}
  log(folder, "link")
  chain
    ( function (cb) { fs.stat(folder, function (er, stats) {
        if (er) return cb(er)
        if (!stats.isDirectory()) return cb(new Error(
          "npm link requires a directory"))
        cb()
      })}
    , [log, "reading "+jsonFile, "link"]
    , function (cb) { readJson
        ( jsonFile
        , "-1-LINK-"+(
            crypto.createHash("sha1").update(folder).digest("hex").substr(0,8)
          )
        , function (er, data) {
            if (er) return cb(er)
            log(data.name+" "+data.version, "link")
            pkg._data = data
            cb()
          }
        )
      }
    , function (cb) {
        var data = pkg && pkg._data || pkg
          , pkgDir = path.join(npm.dir, data.name, data.version, "package")
        require("./utils/link")(folder, pkgDir, cb)
      }
    , [npm.commands, "build", [pkg]]
    , cb
    )
}
