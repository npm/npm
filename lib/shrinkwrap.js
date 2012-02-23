// emit JSON describing versions of all packages currently installed (for later
// use with shrinkwrap install)

module.exports = exports = shrinkwrap

var npm = require("./npm.js")
  , output = require("./utils/output.js")
  , log = require("./utils/log.js")
  , fs = require('fs')
  , path = require('path')

shrinkwrap.usage = "npm shrinkwrap"

function shrinkwrap (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  if (args.length) {
    log.warn("shrinkwrap doesn't take positional args.")
  }

  npm.commands.ls([], true, function (er, pkginfo) {
    if (er) return cb(er)

    var wrapped = {}

    if (pkginfo.name) {
      wrapped.name = pkginfo.name
    }

    try {
      shrinkwrapPkg(log, pkginfo.name, pkginfo, wrapped)
    } catch (ex) {
      return cb(ex);
    }

    // leave the version field out of the top-level, since it's not used and
    // could only be confusing if it gets out of date.
    delete wrapped.version

    fs.writeFile( path.join(process.cwd(), "npm-shrinkwrap.json")
                , new Buffer(JSON.stringify(wrapped, null, 2) + "\n")
                , function (er) {
      if (er) return cb(er)
      output.write("wrote npm-shrinkwrap.json", function (er) {
        cb(er, wrapped)
      })
    })
  })
}

function shrinkwrapPkg (log, pkgname, pkginfo, rv) {
  var pkg, dep

  if (typeof (pkginfo) == 'string')
    throw (new Error('required dependency not installed: ' + pkgname +
        '@' + pkginfo))

  if (pkginfo.hasOwnProperty('version')) {
    rv.version = pkginfo.version
  }

  if (Object.keys(pkginfo.dependencies).length === 0) return;

  rv.dependencies = {}

  for (pkg in pkginfo.dependencies) {
    dep = pkginfo.dependencies[pkg]
    rv.dependencies[pkg] = {}
    shrinkwrapPkg(log, pkg, dep, rv.dependencies[pkg])

    // package.json must be consistent with the shrinkwrap bundle
    if (dep.extraneous) {
      throw (new Error('package is extraneous: ' + pkg + '@' + dep.version))
    }

    if (dep.invalid) {
      throw (new Error('package is invalid: ' + pkg))
    }
  }
}
