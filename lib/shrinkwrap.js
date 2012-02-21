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
    var nerr

    if (pkginfo['name'])
      wrapped['name'] = pkginfo['name']

    nerr = shrinkwrapPkg(log, pkginfo['name'], pkginfo, wrapped)
    if (nerr > 0)
      return cb(new Error('failed with ' + nerr + ' errors'))

    // leave the version field out of the top-level, since it's not used and
    // could only be confusing if it gets out of date.
    delete wrapped['version']

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
  var pkg, dep, nerr

  if (typeof (pkginfo) == 'string') {
    log.error('required dependency not installed: ' + pkgname + '@' + pkginfo)
    return (1)
  }

  if ('version' in pkginfo)
    rv['version'] = pkginfo['version']

  if (Object.keys(pkginfo['dependencies']).length === 0)
    return (0)

  rv['dependencies'] = {}
  nerr = 0

  for (pkg in pkginfo['dependencies']) {
    dep = pkginfo['dependencies'][pkg]
    rv['dependencies'][pkg] = {}
    nerr += shrinkwrapPkg(log, pkg, dep, rv['dependencies'][pkg])

    // package.json must be consistent with the shrinkwrap bundle
    if (dep['extraneous']) {
      log.error('package is extraneous: ' + pkg + '@' + dep['version'])
      nerr++
    }

    if (dep['invalid']) {
      log.error('package is invalid: ' + pkg)
      nerr++
    }
  }

  return (nerr)
}
