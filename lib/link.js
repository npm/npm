
// link the supplied folder to .npm/{name}/{version}/package

var npm = require("../npm")
  , chain = require("./utils/chain")
  , log = require("./utils/log")
  , fs = require("./utils/graceful-fs")
  , readJson = require("./utils/read-json")
  , rm = require("./utils/rm-rf")
  , path = require("path")
  , crypto
  , readInstalled = require("./utils/read-installed")
  , semver = require("semver")
  , symlink = require("./utils/link")
  , url = require("url")

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}

module.exports = link
link.usage = "npm link <folder>"
function link (args, cb) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the link feature"))
  var folder = args.shift() || "."
  // folder's root MUST contain a package.json
  // read that for package info, then link it in, clobbering if necessary.
  if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
  var jsonFile = path.join(folder, "package.json")
  log(folder, "link")
  chain
    ( function (cb) { fs.stat(folder, function (er, stats) {
        if (er) return cb(er)
        if (!stats.isDirectory()) return cb(new Error(
          "npm link requires a directory"))
        cb()
      })}
    , [log.verbose, "reading "+jsonFile, "link"]
    , [readAndLink, jsonFile, folder]
    , cb
    )
}

function readAndLink (jsonFile, folder, cb) {
  readJson
    ( jsonFile
    , { "tag" : "9999.0.0-LINK-"+(
        crypto.createHash("sha1").update(folder).digest("hex").substr(0,8)
      )}
    , function (er, data) {
        if (er) return cb(er)
        getDeps(data, folder, function (er, deps) {
          if (er) return cb(er)
          doLink(data, folder, deps, cb)
        })
      }
    )
}

function getDeps (data, folder, cb) {
  var deps = data.dependencies || {}
    , devDeps = data.devDependencies || {}
  Object.keys(devDeps).forEach(function (d) { deps[d] = devDeps[d] })

  // bundle-install the url deps
  var bundles = []
  Object.keys(deps).forEach(function (d) {
    var u = url.parse(deps[d])
    if (u && u.protocol && u.host) {
      bundles.push(u.href)
      delete deps[d]
    }
  })

  if (!bundles.length) return postBundle(null)

  log.silly(bundles, "bundles for "+data._id)
  npm.commands.bundle(["install"].concat(bundles), folder, postBundle)

  function postBundle (er) {
    if (er) return cb(er)
    // filter out any bundled deps.  those don't need to be installed
    fs.readdir(path.join(folder, "node_modules"), function (er, bundled) {
      if (er && !bundled) bundled = []
      bundled.forEach(function (b) { delete deps[b] })
      cb(null, deps)
    })
  }
}

function doLink (data, folder, deps, cb) {
  log.verbose(data._id, "link")
  var pkgDir = path.join(npm.dir, data.name, data.version, "package")
    , depNames = Object.keys(deps)

  // skip any that are installed
  readInstalled(depNames, function (er, inst) {
    if (er) return log.er(cb, "Couldn't read installed packages")(er)
    var depsNeeded = Object.keys(deps).filter(function (d) {
      var satis = semver.maxSatisfying(Object.keys(inst[d] || {}), deps[d])
      return !satis
    }).map(function (d) { return d+"@"+deps[d] })
    chain
      ( depsNeeded.length && [ npm.commands, "install", depsNeeded.slice(0) ]
      , [ symlink, folder, pkgDir ]
      , [ npm.commands, "build", [data] ]
      , function (er) {
          if (!er || !npm.config.get("rollback")) return cb(er)
          // error, rollback
          npm.ROLLBACK = true
          log.error(er, "error linking, rollback")
          var rb = depsNeeded.concat([data.name+"@"+data.version])
          npm.commands.rm(rb, function (er_) {
            if (er_) log.error(er_, "error rolling back")
            cb(er)
          })
        }
      )
  })
}
