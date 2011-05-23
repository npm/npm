
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
  , build = require("./build")

module.exports = link

link.usage = "npm link (in package dir)"
           + "\nnpm link <pkg> (link global into local)"

link.completion = function (opts, cb) {
  var dir = path.join(npm.config.get("prefix"), "lib", "node_modules")
  fs.readdir(dir, function (er, files) {
    cb(er, files.filter(function (f) {
      return f.charAt(0) !== "."
    }))
  })
}

function link (args, cb) {
  if (npm.config.get("global")) {
    return cb(new Error("link should never be --global.\n"
                       +"Please re-run this command with --local"))
  }
  if (args.length === 1 && args[0] === ".") args = []
  if (args.length) return linkInstall(args, cb)
  linkPkg(npm.prefix, cb)
}

function linkInstall (pkgs, cb) {
  var gp = npm.config.get("prefix")
  asyncMap(pkgs, function (pkg, cb) {
    function n (er, data) {
      if (er) return cb(er, data)
      // install returns [ [folder, pkgId], ... ]
      // but we definitely installed just one thing.
      pp = data[0][0]
      pkg = path.basename(pp)
      target = path.resolve(npm.dir, pkg)
      next()
    }

    var t = path.resolve(gp, "lib")
      , pp = path.resolve(t, "node_modules", pkg)
      , rp = null
      , target = path.resolve(npm.dir, pkg)

    // if it's a folder or a random not-installed thing, then
    // link or install it first
    if (pkg.indexOf("/") !== -1 || pkg.indexOf("\\") !== -1) {
      return fs.lstat(path.resolve(pkg), function (er, st) {
        if (er || !st.isDirectory()) {
          npm.commands.install(t, pkg, n)
        } else {
          rp = path.resolve(pkg)
          linkPkg(rp, n)
        }
      })
    }

    fs.lstat(pp, function (er, st) {
      if (er) {
        rp = pp
        return npm.commands.install(t, pkg, n)
      } else if (!st.isSymbolicLink()) {
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
        , [log.verbose, "symlinking " + pp + " to "+target, "link"]
        , [symlink, pp, target]
        // do run lifecycle scripts - full build here.
        , rp && [build, [target]]
        , [ resultPrinter, pkg, pp, target, rp ]
        , cb )
    }
  }, cb)
}

function linkPkg (folder, cb_) {
  var gp = npm.config.get("prefix")
    , me = folder || npm.prefix
    , readJson = require("./utils/read-json")
  readJson( path.resolve(me, "package.json")
          , { dev: true }
          , function (er, d) {
    function cb (er) {
      return cb_(er, [[target, d && d._id]])
    }
    if (er) return cb(er)
    var target = path.resolve(gp, "lib", "node_modules", d.name)
    rm(target, function (er) {
      if (er) return cb(er)
      symlink(me, target, function (er) {
        if (er) return cb(er)
        log.verbose(target, "link: build target")
        // also install missing dependencies.
        npm.commands.install(me, [], function (er, installed) {
          if (er) return cb(er)
          // build the global stuff.  Don't run *any* scripts, because
          // install command already will have done that.
          build([target], true, build._noLC, true, function (er) {
            if (er) return cb(er)
            resultPrinter(path.basename(me), me, target, cb)
          })
        })
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
  output.write(where+" -> "+(src.trim())
              +(rp ? " -> "+rp: ""), cb)
}
