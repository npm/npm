// emit JSON describing versions of all packages currently installed (for later
// use with shrinkwrap install)

module.exports = exports = shrinkwrap

var npm = require("./npm.js")
  , log = require("npmlog")
  , fs = require("fs")
  , path = require("path")
  , readJson = require("read-package-json")
  , readInstalled = require("read-installed")

shrinkwrap.usage = "npm shrinkwrap"

function shrinkwrap (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  if (args.length) {
    log.warn("shrinkwrap", "doesn't take positional args")
  }

  npm.commands.ls([], true, function (er, _, pkginfo) {
    if (er) return cb(er)
    shrinkwrap_(pkginfo, silent, npm.config.get("dev"), cb)
  })
}

function shrinkwrap_ (pkginfo, silent, dev, cb) {
  if (pkginfo.problems) {
    return cb(new Error("Problems were encountered\n"
                       +"Please correct and try again.\n"
                       +pkginfo.problems.join("\n")))
  }

  if (!dev)
    return save(pkginfo, silent, cb)

  // remove dev deps unless the user does --dev
  getExcludes(function(er, exclude) {
    if (er) return cb(er)

    exclude.forEach(function (dep) {
      log.warn("shrinkwrap", "Excluding devDependency: %s", dep)
      delete pkginfo.dependencies[dep]
    })

    save(pkginfo, silent, cb)
  })
}

function getExcludes(cb) {

  var exclude = []
    , depth = npm.config.get("depth")
    , dir = path.resolve(npm.dir, "..")

  // exclude devDependencies
  readJson(path.resolve(npm.prefix, "package.json"), function (er, data) {
    if (er) return cb(er)

    if (data.devDependencies)
      exclude = [].concat(Object.keys(data.devDependencies))

    // exclude peerDependencies of devDependencies
    readInstalled(dir, depth, log.warn, function (er, data) {
      if (er) return cb(er)

      if (data.devDependencies) {
        var deps = data.dependencies || {};
        for (name in deps)
          if (name in data.devDependencies && deps[name].peerDependencies)
            exclude = exclude.concat(Object.keys(deps[name].peerDependencies))
      }

      // return unique excludes
      cb(null, exclude.filter(function(elem, pos) {
        return exclude.indexOf(elem) === pos
      }))
    })
  })
}

function save (pkginfo, silent, cb) {
  try {
    var swdata = JSON.stringify(pkginfo, null, 2) + "\n"
  } catch (er) {
    log.error("shrinkwrap", "Error converting package info to json")
    return cb(er)
  }

  var file = path.resolve(npm.prefix, "npm-shrinkwrap.json")

  fs.writeFile(file, swdata, function (er) {
    if (er) return cb(er)
    if (silent) return cb(null, pkginfo)
    console.log("wrote npm-shrinkwrap.json")
    cb(null, pkginfo)
  })
}
