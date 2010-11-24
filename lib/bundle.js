
module.exports = bundle

var npm = require("../npm")
  , path = require("path")
  , log = require("./utils/log")
  , cache = require("./cache")
  , readJson = require("./utils/read-json")
  , mkdir = require("./utils/mkdir-p")
  , fs = require("./utils/graceful-fs")
  , conf = require("./utils/ini").configList

bundle.usage = "npm bundle\n"
             + "npm bundle install <pkg> [<pkg>...]\n"
             + "npm bundle rm <pkgname> [<pkgname>...]\n"
             + "(run in package dir)"

function bundle (args, cb_) {
  var location = path.join(process.cwd(), "./node_modules")
    , pkg = process.cwd()
    , cmd = args.shift()
  function cb (er, data) {
    conf.shift()
    cb_(er, data)
  }
  mkdir(location, function (er) {
    var c = { root : location
            , binroot : null
            , manroot : null
            }
    conf.unshift(c)
    if (cmd && npm.commands[cmd] === npm.commands.ls) {
      // args.push("installed")
      c.registry = null
    }

    if (er) return cb(new Error(bundle.usage))
    mkdir(npm.dir, function(er) {
      if (er) return log.er(cb, "Error creating "+npm.dir+" for bundling")(er)
      if (typeof npm.commands[cmd] === "function") {
        return npm.commands[cmd](args, cb)
      }

      // no command given, just install the local deps.
      // just read the package.json from the directory to
      // avoid adding the whole package to the cache
      readJson(path.join(pkg, "package.json"), function (er, data) {
        if (er) return log.er(cb, "Error reading "+pkg+"/package.json")(er)
        install(data, location, cb)
      })
    })
  })
}

function install (data, location, cb) {
  if (typeof data.dependencies === 'undefined') {
    return cb(new Error("Package has no dependencies"))
  }
  var depNames = Object.keys(data.dependencies)
    , deps = depNames.map(function (d) {
        var v = data.dependencies[d]
        if (v === "*") v = ""
        return d+"@"+v
      })
  log.verbose(deps, "bundle deps")
  npm.commands.install(deps, cb)
}
