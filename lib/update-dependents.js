/*

This command is plumbing.

npm update-deps <pkg>

For each other version of pkg, for each dependent in other
version's dependents folder, if the new version would satisfy the
dependency as well, update other version's dependent's dependency
links to point at the new version

If no dependents are left, then remove old version

*/

module.exports = updateDependents

var readInstalled = require("./utils/read-installed")
  , path = require("path")
  , npm = require("../npm")
  , chain = require("./utils/chain")
  , semver = require("./utils/semver")
  , link = require("./utils/link")
  , linkIfExists = link.ifExists
  , shim = require("./utils/write-shim")
  , shimIfExists = shim.ifExists
  , readJson = require("./utils/read-json")
  , log = require("./utils/log")
  , fs = require("fs")
  , rm = require("./utils/rm-rf")
  , lifecycle = require("./utils/lifecycle")

function updateDependents (args, cb) {
  // replace args with the installed data
  if (!args.length) return cb() // nothing to do
  readArgs(args, function (er, args) {
    if (er) return log.er(cb, "Error reading args")(er)
    
    cb = (function (cb) { return function (er) {
      var a = args.map(function (a) { return a._id })
      log( a, (er) ? "failed to update dependents" : "updated dependents")
      return cb(er)
    }})(cb)
    // now this is an array of package descriptors
    // and each one is installed, and has siblings.
    // update any dependents on any other versions to this one,
    // if it satisfies them, and then remove them if they have
    // no more dependents
    if (!args.length) return log(
      "Nothing to update", "update dependents", cb)
    chain(args.map(function (arg) { return function (cb) {
      chain
        ( [lifecycle, arg, "preupdatedependents"]
        , [updateDepsTo, arg]
        , [lifecycle, arg, "updatedependents"]
        , [lifecycle, arg, "postupdatedependents"]
        , cb
        )
    }}).concat(function (er) {
      // now they've all been updated, so remove the others.
      var rmList = []
      args.forEach(function (arg) {
        // if (!arg._others) log(arg); return
        arg._others.forEach(function (o) {
          rmList.push(arg.name+"@"+o)
        })
      })
      npm.commands.rm(rmList, function (er) {
        // if it can't be removed, that's actually fine.
        if (er) log(er.message.split("\n")[0], "not removing")
        cb()
      })
    }))
  })
}

// update the _others to this one.
function updateDepsTo (arg, cb) {
  chain(arg._others.map(function (o) {
    return [updateOtherVersionDeps, o, arg]
  }).concat(cb))
}

function updateOtherVersionDeps (other, pkg, cb) {
  var depdir = path.join( npm.dir
                        , pkg.name
                        , other
                        , "dependents"
                        )
  fs.readdir(depdir, function (er, deps) {
    // if the package didn't have any deps, then this folder
    // would not be created.
    if (er) return log("no dependents", "update", cb)
    // for each of these, update the dependency on
    // other to pkg
    if (!deps.length) return cb()
    chain(deps.map(function (d) {
      // todo: make this a @ instead of a -
      d = d.split("-")
      var name = d.shift()
        , ver = d.join("-")
      return [updateDepToNew, name, ver, pkg, other]
    }).concat(cb))
  })
}
function updateDepToNew (depName, depVer, pkg, other, cb) {
  var depdir = path.join(npm.dir, depName, depVer)
    , jsonFile = path.join(depdir, "package", "package.json")
  readJson(jsonFile, function (er, data) {
    if (er) return log.er(cb, "failed to read "+jsonFile)(er)
    // check if pkg is ok
    var dependencies = data.dependencies
    if (!dependencies) return log
      ( "Weird, "+depName+"@"+depVer+" doesn't have any dependencies"
      , "wtf?"
      , cb
      )
    if (Array.isArray(dependencies)) {
      var deps = {}
      dependencies.forEach(function (d) { deps[d] = "*" })
      dependencies = deps
    }
    var dependency = data.dependencies[pkg.name]
    if (!dependency) return log
      ( "Weird, "+depName+"@"+depVer+" doesn't depend on "+pkg.name
      , "wtf?"
      , cb
      )
    if (!semver.satisfies(pkg.version, dependency)) return log
      ( pkg._id + " doesn't satisfy "+depName+"@"+depVer
      , "not updating"
      , cb
      )

    chain
      ( [ removeDependencyLinks, data, pkg, other ]
      , [ createDependencyLinks, data, pkg ]
      , cb
      )
  })
}

function removeDependencyLinks (dep, pkg, other, cb) {
  var depdir = path.join(npm.dir, dep.name, dep.version)
    , depsOn = path.join(depdir, "dependson", pkg.name+"-"+other)
    , deps = path.join(depdir, "dependencies", pkg.name)
    , dependentLink = path.join( npm.dir
                               , pkg.name
                               , other
                               , "dependents"
                               , dep.name + "-" + dep.version
                               )
  chain
    ( [ rm, deps+".js" ]
    , [ rm, deps ]
    , [ rm, depsOn ]
    , [ rm, dependentLink ]
    , cb
    )
}
function createDependencyLinks (dep, pkg, cb) {
  var depdir = path.join(npm.dir, dep.name, dep.version)
    , depsOn = path.join( depdir
                        , "dependson"
                        , pkg.name+"-"+pkg.version
                        )
    , deps = path.join(depdir, "dependencies", pkg.name)
    , targetRoot = path.join(npm.dir, pkg.name, pkg.version)
    , targetMain = path.join(targetRoot, "main.js")
    , targetLib = path.join(targetRoot, "lib")
    , dependentLink = path.join( npm.dir
                               , pkg.name
                               , pkg.version
                               , "dependents"
                               , dep.name + "-" + dep.version
                               )
  chain
    ( [ link, targetRoot, depsOn ]
    , [ link, depdir, dependentLink ]
    , [ linkIfExists, targetLib, deps ]
    , [ shimIfExists, targetMain, deps + ".js" ]
    , cb
    )
}

function readArgs (args, cb) {
  var p = args.length
  function r () { if (--p === 0) {
    cb(null, args.filter(function (a) { return a }))
  }}
  function readOthers (arg, i) {
    readInstalled([arg.name], function (er, inst) {
      if (er) {
        args[i] = null
        return log(er, "Error reading installed", r)
      }
      var have = Object.keys(inst[arg.name])
      if (have.length < 2) {
        args[i] = null
        return log(
          "Only one version installed", "update-dependents "+arg.name, r)
      }
      arg._others = have.filter(function (v) { return v !== arg.version })
      r()
    })
  }

  args.forEach(function (arg, i) {
    if (typeof arg === "object") return readOthers(arg, i)
    arg = arg.split(/@/)
    var name = arg.shift()
      , ver = arg.join("@")
      , jsonFile = path.join( npm.dir
                            , name
                            , ver
                            , "package"
                            , "package.json"
                            )
    readJson(jsonFile, function (er, arg) {
      if (er) {
        args[i] = null
        return log(er, "Error reading "+jsonFile, r)
      }
      args[i] = arg
      readOthers(arg, i)
    })
  })
}
