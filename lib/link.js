
// link with no args: symlink the folder to the global location
// link with package arg: symlink the global to the local

var npm = require("../npm")
  , symlink = require("./utils/link")
  , fs = require("./utils/graceful-fs")
  , log = require("./utils/log")
  , asyncMap = require("./utils/async-map")
  , chain = require("./utils/chain")
  , path = require("path")
  , relativize = require("./utils/relativize")
  , rm = require("./utils/rm-rf")
  , output = require("./utils/output")

module.exports = link

link.usage = "npm link (in package dir)"
           + "\nnpm link <pkg> (link global into local)"

link.completion = function (opts, cb) {
  var dir = path.join(npm.config.get("prefix"), "node_modules")
  fs.readdir(dir, function (er, files) {
    cb(er, files.filter(function (f) {
      return f.charAt(0) !== "."
    }))
  })
}

function link (args, cb) {
  if (npm.config.get("global")) {
    return cb(new Error("link should never be --global."))
  }
  if (args.length) return linkInstall(args, cb)
  linkPkg(npm.prefix, cb)
}

function linkInstall (pkgs, cb) {
  var gp = npm.config.get("prefix")
  asyncMap(pkgs, function (pkg, cb) {
    var pp = path.resolve(gp, "node_modules", pkg)
      , rp = null
      , target = path.resolve(npm.dir, pkg)
    fs.lstat(pp, function (er, st) {
      if (er) {
        log.error(pkg, "not installed globally")
        next()
      } else if (!st.isSymbolicLink()) {
        log.warn(pkg, "not a symbolic link")
        rp = pp
        next()
      } else {
        return fs.realpath(pp, function (er, real) {
          if (er) log.warn(pkg, "invalid symbolic link")
          else rp = real
          next()
        })
      }
    })

    function next () {
      chain
        ( [npm.commands, "unbuild", [target]]
        , [symlink, pp, target]
        , rp && [npm.commands, "build", [target]]
        , [ resultPrinter, pkg, pp, target, rp ]
        , cb )
    }
  }, cb)
}

function linkPkg (folder, cb) {
  var gp = npm.config.get("prefix")
    , me = npm.prefix
    , target = path.resolve(gp, "node_modules", path.basename(me))
  rm(target, function (er) {
    if (er) return cb(er)
    symlink(me, target, function (er) {
      if (er) return cb(er)
      npm.commands.build([target], function (er) {
        if (er) return cb(er)
        resultPrinter(path.basename(me), me, target, cb)
      })
    })
  })
}

function resultPrinter (pkg, src, dest, rp, cb) {
  if (typeof cb !== "function") cb = rp, rp = null
  var where = relativize(dest, path.resolve(process.cwd(),"x"))
  rp = (rp || "").trim()
  src = (src || "").trim()
  if (rp === src) rp = null
  output.write(where+"@ -> "+(src.trim())
              +(rp ? "@ -> "+rp: ""), cb)
}
