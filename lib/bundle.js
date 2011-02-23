
module.exports = bundle

var npm = require("../npm")
  , path = require("path")
  , log = require("./utils/log")
  , cache = require("./cache")
  , readJson = require("./utils/read-json")
  , mkdir = require("./utils/mkdir-p")
  , fs = require("./utils/graceful-fs")
  , conf = require("./utils/ini").configList
  , rm = require("./utils/rm-rf")
  , url = require("url")
  , notAllowed = [ "adduser", "build", "bundle", "config", "init", "link"
                 , "owner", "publish", "restart", "start", "stop", "tag"
                 , "unpublish", "update-dependents", "view", "bn" ]

bundle.usage = "npm bundle\n"
             + "npm bundle destroy\n"
             + "npm bundle <cmd> <args>\n"
             + "(run in package dir)"

bundle.completion = function(args, index, cb) {
  var getCompletions = require("./utils/completion/get-completions")
    , subcmdList = npm.fullList.filter(function(c) {
        return notAllowed.indexOf(c) === -1
      }).concat(["destroy"])
    , subcmd = args[0] || ""

  if (subcmdList.indexOf(subcmd) !== -1) {
    var subargs = args.slice(1)
    npm.commands[npm.deref(subcmd)].completion(subargs, index - 1, cb)
  } else if (index < 3) cb(null, getCompletions(subcmd, subcmdList))
}

function bundle (args, dir, cb_) {
  if (typeof dir === "function") cb_ = dir, dir = process.cwd()
  var location = path.join(dir, "node_modules")
    , binRoot = path.join(dir, "node_modules", ".bin")
    , pkg = dir
    , cmd = args.shift()
  function cb (er, data) {
    conf.shift()
    cb_(er, data)
  }
  mkdir(location, function (er) {
    if (er) return cb(new Error(bundle.usage))
    var c = { root : location
            , binroot : binRoot
            , manroot : null
            , "must-install" : false
            }
    conf.unshift(c)

    if (cmd && npm.commands[cmd]) {
      cmd = npm.commands[cmd]
      for (var i = 0, l = notAllowed.length; i < l; i ++) {
        var na = notAllowed[i]
        if (cmd === npm.commands[na]) {
          if (na === "init") log.error(
            "\nIt looks like you might be coming from ruby, where\n"+
            "`bundle init` is a thing.  The conceptual model is a bit\n"+
            "different with npm.  See `npm help developers`\n")
          return cb(new Error(na + " command not allowed in bundle"))
        }
      }
      if (cmd === npm.commands.ls) c.registry = null
    }

    if (cmd === "destroy") return rm(location, function (er) {
      if (er) return cb(er)
      log.info(location, "destroyed", cb)
    })

    if (cmd === npm.commands.install && args.length === 0) {
      // `npm bundle install` --> npm bundle
      // Don't try to install the cwd inside of ./node_modules
      cmd = null
    }

    if (typeof cmd === "function") {
      return cmd(args, cb)
    }

    // no command given, just install the local deps.
    // just read the package.json from the directory to
    // avoid adding the whole package to the cache
    readJson(path.join(pkg, "package.json"), function (er, data) {
      if (er) return log.er(cb, "Error reading "+pkg+"/package.json")(er)
      install(data, location, cb)
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
        var u = url.parse(v)
        if (u && u.protocol && u.host) {
          return u.href
        }
        return v ? d + "@" + v : d
      })
  log.verbose(deps, "bundle deps")
  npm.commands.install(deps, log.er(cb, "Some dependencies failed to bundle\n"
                                      + "Bundle them separately with\n"
                                      + "  npm bundle install <pkg>"))
}
