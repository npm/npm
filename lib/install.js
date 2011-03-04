
// npm install <pkg> <pkg> <pkg>
// npm install <pkg@version> <pkg@"1.0.0 - 1.99.99"> <pkg[@latest]> <pkg@tagname>

// ALGORITHM 1: Deeper, more repetition, easier to update, faster runtime lookups
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// for each dep@version in what.dependencies
//     not in previously
//     and not in where/node_modules/what/node_modules
//   install(where/node_modules/what, dep, previously + what)
//
// ALGORITHM 2: Disk efficient, less repetition, more sharing.
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// for each dep@version in what.dependencies
//     not in where/nm/what/nm/*
//     and not in previously
//   install(where/node_modules/what, dep, previously+precise version deps)
//
// ALGORITHM 3: Most disk efficient, minimum repetition. "Squash left"
// install(where, what, previously)
// fetch what, unpack into where/node_modules
// for each dep in what.dependencies
//   resolve dep to precise version
// list1 = [], list2 = []
// for each dep@version in what.dependencies
//     and not in where/nm/what/nm/*
//     and not in previously
//   if dep not in where/node_modules
//     add dep to list1
//   else add dep to list2
// for each dep@version in list1
//   install(where, dep@version, previously+list1)
// for each dep@version in list2
//   install(where, dep@version, previously+list1+list2)
//
// For package{dep} structure: A{B,C}, B{C}, C{D}
//
// Algorithm 1 produces:
// A
// +-- B
// |   `-- C
// |       `-- D
// `-- C
//     `-- D
//
// Algorithm 2 produces:
// A
// +-- B
// `-- C
//     `-- D
//
// Algorithm 3 produces:
//
// A
// +-- B
// +-- C
// `-- D
//
// At first glance, 2 is clearly better.  However, if A wants to update to
// C', which conflicts with B's dependency on C, then the update algorithm
// must be clever enough to detect this, and install C directly in B.  With
// installation algorithm 1, the update process simply detects that B will
// not be satisfied by C', and leave it alone.
//
// Even though it makes updating slightly more complicated, that complication
// is unavoidable.  `npm update` should always be smart enough to detect
// and prevent contract breakage, even if it was the result of some manual
// intervention.
//
// Algorithm 3 looks nice but is obnoxious.  It's very likely that old deps
// will be left behind when things are removed, even if they're no longer
// necessary, and detecting that will be tricky.  With algo2, however,
// removing C will require a check to make sure that no other packages
// are depending on it.
//
// Conclusion: Use algorithm 1.  Switching is easy anyway.
//
// Managing "previously" lists...
// every time we dive into a deeper node_modules folder, the "previously"
// list that gets passed along uses the previous "previously" list as
// it's __proto__.  Any "resolved precise dependency" things that aren't
// already on this object get added, and then that's passed to the next
// generation of installation.

module.exports = install

install.usage = "npm install <tarball file>"
              + "\nnpm install <tarball url>"
              + "\nnpm install <folder>"
              + "\nnpm install <pkg>"
              + "\nnpm install <pkg>@<tag>"
              + "\nnpm install <pkg>@<version>"
              + "\nnpm install <pkg>@<version range>"
              + "\n\nCan specify one or more: npm install ./foo.tgz bar@stable /some/folder"
              + "\nInstalls dependencies in ./package.json if no argument supplied"

install.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, true, true, true, cb)
}

var registry = require("./utils/registry")
  , npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , installedPackages
  , semver = require("semver")
  , url = require("url")
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , path = require("path")
  , fs = require("./utils/graceful-fs")
  , cache = require("./cache")
  , asyncMap = require("./utils/async-map")
  , chain = require("./utils/chain")
  , rm = require("./utils/rm-rf")
  , lifecycle = require("./utils/lifecycle")

function install (args, cb) {
  // install dependencies locally by default,
  // or install current folder globally
  if (!args.length) {
    if (npm.config.get("global")) args = ["."]
    else return readJson(path.resolve("package.json"), function (er, data) {
      if (er) return log.er(cb, "Couldn't read dependencies.")(er)
      var deps = Object.keys(data.dependencies || {})
      if (!deps.length) return log("Nothing to do", "install", cb)
      install(deps.map(function (dep) {
        return dep+"@"+data.dependencies[dep]
      }), cb)
    })
  }

  var where = npm.config.get("global")
            ? npm.config.get("prefix")
            : process.cwd()

  // initial "previously" is the name:version of the root, if it's got
  // a pacakge.json file.
  readJson(path.resolve(where, "package.json"), function (er, data) {
    if (er) data = null
    var previously = {}
    if (data) previously[data.name] = data.version
    installMany(args, where, previously, true, cb)
  })
}

function installMany (what, where, previously, explicit, cb) {
  log.info(what, "into "+where)
  // what is a list of things.
  // resolve each one.
  asyncMap(what, targetResolver(where, previously, explicit)
          ,function (er, targets) {
    // each target will be a data object corresponding
    // to a package, folder, or whatever that is in the cache now.
    log(targets, "resolved")
    log.info(targets.map(function (t) { return t && t._id})
            , "(resolved) into "+where)
    asyncMap(targets, function (target, cb) {
      installOne(target, where, previously, cb)
    }, cb)
  })
}

function targetResolver (where, previously, explicit) {
  var alreadyInstalledManually = explicit ? [] : null
    , nm = path.resolve(where, "node_modules")

  if (!explicit) fs.readdir(nm, function (er, inst) {
    if (er) return alreadyInstalledManually = []
    alreadyInstalledManually = inst
  })

  var to = 0
  return function resolver (what, cb) {
    if (!alreadyInstalledManually) return setTimeout(function () {
      resolver(what, cb)
    }, to++)
    // now we know what's been installed here manually,
    // or tampered with in some way that npm doesn't want to overwrite.
    if (alreadyInstalledManually.indexOf(what) !== -1) {
      log("skipping "+what, "already installed manually in "+where)
      return cb(null, [])
    }
    cache.add(what, function (er, data) {
      if (!er && data && previously[data.name] === data.version) {
        return cb(null, [])
      }
      return cb(er, data)
    })
  }
}

// we've already decided to install this.  if anything's in the way,
// then uninstall it first.
function installOne (target, where, previously, cb_) {
  var nm = path.resolve(where, "node_modules")
    , targetFolder = path.resolve(nm, target.name)
    , up = !npm.config.get("global") || npm.config.get("unsafe-perm")
    , user = up ? null : npm.config.get("user")
    , group = up ? null : npm.config.get("group")

  function cb (er) {
    if (er) return cb_(er)
    console.log(target._id+": "+targetFolder)
    cb_()
  }

  chain
    ( [ npm.commands.unbuild, [targetFolder] ]
    , [ cache.unpack, target.name, target.version, targetFolder
      , null, null, user, group ]
    , [ lifecycle, target, "preinstall", targetFolder ]
    , function (cb) {
        var deps = Object.keys(target.dependencies || {})
        if (!deps.length) return cb()

        var newPrev = Object.create(previously)

        newPrev[target.name] = target.version
        installMany(deps.map(function (d) {
          return d + "@" + target.dependencies[d]
        }), targetFolder, newPrev, false, function (er) {
          if (er) return cb(er)
          chain([[npm.commands.build, [targetFolder]]]
            .concat(["install","postinstall"].map(function (s) {
              return [lifecycle, target, s, targetFolder]
            }).concat(cb)))
        })
      }
    , cb
    )
}
