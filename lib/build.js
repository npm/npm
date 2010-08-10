
// npm build command

// everything about the installation after the creation of
// the .npm/{name}/{version}/package folder.
// linking the main.js and libs folder, dropping these into
// the npm.root, resolving dependencies, etc.

// This runs AFTER install or link are completed.

var npm = require("../npm")
  , log = require("./utils/log")
  , rm = require("./utils/rm-rf")
  , chain = require("./utils/chain")
  , fetch = require("./utils/fetch")
  , fs = require("fs")
  , path = require("path")
  , semver = require("./utils/semver")
  , mkdir = require("./utils/mkdir-p")
  , lifecycle = require("./utils/lifecycle")
  , readJson = require("./utils/read-json")
  , ini = require("./utils/ini")
  , sys = require("sys")
  , writeShim = require("./utils/write-shim")
  , link = require("./utils/link")
  , linkIfExists = link.ifExists
  , shimIfExists = writeShim.ifExists
  , readInstalled = require("./utils/read-installed")

module.exports = build

// pkg is either a "package" folder, or a package.json data obj, or an
// object that has the package.json data on the _data member.
function build (args, cb) {
  readAll(args, function (er, args) {
    if (er) return cb(er)
    chain(args.map(function (a) {
      return [buildStep, a]
    }).concat(
      [ [ linkDependencies, args]
      , [ finishBuild, args ]
      ]).concat(cb))
  })
}

function buildStep (pkg, cb) {
  pkg = pkg && pkg._data || pkg
  if (!pkg) return cb(new Error("Invalid package data "+sys.inspect(pkg)))
  chain
    ( [lifecycle, pkg, "preinstall"]
      // make sure that all dependencies are already installed.
    , [resolveDependencies, pkg]

      // generate ROOT/.npm/{name}/{version}/main.js
    , [createMain, pkg]

      // symlink ROOT/{name}-{version}.js to ROOT/.npm/{name}/{version}/main.js
    , [linkMain, pkg]

      // symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
    , [linkLib, pkg]

      // symlink any bins into the node install prefix
    , [linkBins, pkg]

    , cb
    )
}
function autoUpdate (pkg, cb) {
  var auto = npm.config.get("update-dependents")
  if (!auto) return log(
    "update-dependents disabled by config", "update-dependents", cb)
  pkg = pkg && pkg._data || pkg
  if (auto === "always") {
    return npm.commands["update-dependents"]([pkg], cb)
  }
  readInstalled(pkg.name, function (er, inst) {
    if (er) return cb(er)
    var versions = Object.keys(inst[pkg.name])
                   .filter(function (v) { return v !== pkg.version })
                   .sort(semver.sort)
      , maxHave = versions.pop()
    if (!maxHave) return log(
      "only version, no dependencies to update", "update-dependents", cb)
    if (!semver.gt(pkg.version, maxHave)) return log(
      "downgrade, not updating dependencencies", "update-dependents", cb)
    npm.commands["update-dependents"]([pkg], cb)
  })
}
function autoActivate (pkg, cb) {
  var auto = npm.config.get("auto-activate")
  if (!auto) return log(
    "auto-activate disabled by config", "auto-activate", cb)
  pkg = pkg && pkg._data || pkg
  // get the list of versions of this package.
  readInstalled(pkg.name, function (er, inst) {
    if (er) return cb(er)
    var versions = Object.keys(inst)
    if (auto !== "always" && versions.indexOf("active") !== -1) {
      log("another version already active", "auto-activate")
      log("to activate, do:   npm activate "+
        pkg.name+" "+pkg.version, "auto-activate")
      return cb()
    }
    log(pkg.name+"@"+pkg.version, "activate")
    npm.commands.activate([pkg.name+"@"+pkg.version], cb)
  })
}

function readAll (folders, cb) {
  folders = folders.slice(0)
  var data = []
  ;(function R (folder) {
    if (!folder) return cb(null, data)
    if (typeof folder === "object") {
      data.push(folder)
      return R(folders.pop())
    }
    readJson(path.join(folder, "package.json"), function (er, d) {
      if (er) return cb(er)
      data.push(d)
      return R(folders.pop())
    })
  })(folders.pop())
}

// make sure that all the dependencies have been installed.
function resolveDependencies (pkg, topCb) {
  if (!pkg) return topCb(new Error("Package not found to resolve dependencies"))
  // link foo-1.0.3 to ROOT/.npm/{pkg}/{version}/dependencies/foo

  var found = []
  chain
    ( [mkdir, path.join(npm.dir, pkg.name, pkg.version, "dependencies")]
    , function (cb) {
        if (!pkg.dependencies) return topCb()
        // don't create anything until they're all verified.
        var reqs = []
        for (var i in pkg.dependencies) reqs.push({name:i, version:pkg.dependencies[i]})
        if (!reqs.length) return topCb()
        ;(function R (req) {
          if (!req) {
            found.forEach(function (req) {
              log(req.name + "@" + req.version, "found")
            })
            return cb()
          }
          log(req.name+"-"+req.version, "required")
          // see if we have this thing installed.
          fs.readdir(path.join(npm.dir, req.name), function (er, versions) {
            if (er) return cb(new Error(
              "Required package: "+req.name+"("+req.version+") not found."))
            // TODO: Get the "stable" version if there is one.
            // Look that up from the registry.
            var satis = semver.maxSatisfying(versions, req.version)
            if (satis) {
              found.push({name:req.name, version:satis})
              return R(reqs.pop())
            }
            return cb(new Error(
              "Required package: "+req.name+"("+req.version+") not found. "+
              "(Found: "+JSON.stringify(versions)+")"))
          })
        })(reqs.pop())
      }

      // save the resolved dependencies on the pkg data for later
    , function (cb) { pkg._resolvedDeps = found; cb() }
    , topCb
    )
}

function linkDependencies (args, cb) {
  // at this point, we know that all the packages in the "args" list have
  // been installed, and so have all the dependencies in each of their
  // _resolvedDeps array.
  // link each package's _resolvedDeps properly.
  var c = []
  args.filter(function (pkg) {
    return pkg._resolvedDeps && pkg._resolvedDeps.length
  }).forEach(function (pkg) {
    c.push( [ dependentLink, pkg ]
          , [ dependencyLink, pkg ]
          )
  })
  c.push(cb)
  chain(c)
}
// for each dependency, link this pkg into the proper "dependent" folder
function dependentLink (pkg, cb) {
  if (!pkg._resolvedDeps || !pkg._resolvedDeps.length) return cb()
  chain(pkg._resolvedDeps.map(function (dep) {
    var dependents = path.join(npm.dir, dep.name, dep.version, "dependents")
      , to = path.join(dependents, pkg.name + "-" + pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version)
    return [link, from, to]
  }).concat(cb))
}
// link each dep into this pkg's "dependencies" folder
function dependencyLink (pkg, cb) {
  if (!pkg._resolvedDeps || !pkg._resolvedDeps.length) return cb()
  chain(pkg._resolvedDeps.map(function (dep) { return function (cb) {
    pkg.link = pkg.link || {}
    var dependencies = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
      , dependsOn = path.join( npm.dir, pkg.name, pkg.version
                             , "dependson", dep.name + "-" + dep.version
                             )
      , fromRoot = path.join(npm.dir, dep.name, dep.version)
      , fromLib = path.join(npm.root, dep.name + "-" + dep.version)
      , fromMain = fromLib + ".js"
      , toLib = path.join(dependencies, dep.name)
      , toMain = toLib+".js"
      , linkToLib = (dep.name in pkg.link)
        ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[dep.name])
        : null
      , linkToMain = linkToLib ? linkToLib + ".js" : null
    chain([ [ mkdir, dependsOn ]
          , [ link, fromRoot, dependsOn ]
          , [ shimIfExists, fromMain, toMain ]
          , [ linkIfExists, fromLib, toLib ]
          , linkToLib && [ linkIfExists, fromLib, linkToLib ]
          , linkToMain && [ shimIfExists, fromMain, linkToMain ]
          , cb
          ].filter(function (_) { return _ }))
  }}).concat(cb))
}

function createMain (pkg,cb) {
  if (!pkg.main) return cb()
  log(pkg.main, "createMain")
  writeShim
    ( path.join(npm.dir, pkg.name, pkg.version, "package", pkg.main)
    , path.join(npm.dir, pkg.name, pkg.version, "main.js")
    , path.join(npm.dir, pkg.name, pkg.version, "dependencies")
    , cb
    )
}

// symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
function linkLib (pkg, cb) {
  var lib = pkg.directories && pkg.directories.lib || pkg.lib
  if (!lib) return cb()
  log(pkg._id, "linkLib")
  log(" ", "! WARNING !")
  log("Symlinking the lib directory is deprecated", "! WARNING !")
  log("Please don't rely on this feature, as it will be removed.", "! WARNING !")
  log("Use the 'main' module instead.", "! WARNING !")
  log(" ", "! WARNING !")
  var from = path.join(npm.dir, pkg.name, pkg.version, "package", lib)
    , toInternal = path.join(npm.dir, pkg.name, pkg.version, "lib")
    , to = path.join(npm.root, pkg.name+"-"+pkg.version)

  function doLink (er) {
    if (er) return cb(er)
    chain
      ( [rm, toInternal]
      , [rm, to]
      , function (cb) { link(from, toInternal, function (er) {
          if (er) return cb(er)
          link(toInternal, to, cb)
        })}
      , cb
      )
  }

  fs.stat(from, function (er, s) {
    if (er) return cb(new Error("Libs dir not found "+from))
    if (!s.isDirectory()) return cb(new Error("Libs dir not a dir: "+lib))
    // make sure that it doesn't already exist.  If so, rm it.
    fs.lstat(to, function (er, s) {
      if (!er) fs.unlink(to, doLink)
      else doLink()
    })
  })
}

function linkMain (pkg, cb) {
  if (!pkg.main) return cb()
  var from = path.join(npm.dir, pkg.name, pkg.version, "main.js")
    , to = path.join(npm.root, pkg.name+"-"+pkg.version+".js")
  fs.lstat(to, function (er) {
    if (!er) rm(to, function (er) {
      if (er) cb(er)
      else linkMain(pkg, cb)
    })
    else writeShim(from, to, cb)
  })
}

function linkBins (pkg, cb) {
  if (!pkg.bin) return cb()
  log(pkg._id, "linkBins")
  var binroot = npm.config.get("binroot")
    , dep = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
  if (!binroot) return cb()
  if (!process.env.PATH || -1 === process.env.PATH.indexOf(binroot)) {
    log("bins installing to "+binroot+", outside PATH", "warning")
  }
  chain(Object.keys(pkg.bin).filter(function (i) {
    return i.charAt(0) !== "_"
  }).map(function (i) {
    log(i+" "+pkg.bin[i], "linkBin")
    var to = path.join(binroot, i+"-"+pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version, "package", pkg.bin[i])
    return [shimTest, from, to, dep]
  }).concat(log.er(cb, "failed to link bins")))
}

function shimTest (from, to, dep, cb) {
  // if it needs a shim, then call writeShim
  // otherwise, just link it in.
  if (from.match(/\.(node|js)$/)) return writeShim(from, to, dep, cb)
  fs.readFile(from, function (er, data) {
    if (er) return cb(er)
    data = data.toString("ascii")
    var envNode = data.match(/#!(\/usr\/bin\/)?env node/)
      , node = data.match(/#!(\/usr(\/local)?\/bin\/)?node/)
    if (envNode && envNode.index === 0 || node && node.index === 0) {
      return writeShim(from, to, dep, cb)
    }
    return link(from, to, cb)
  })
}

function finishBuild (args, cb) {
  chain(args.map(function (pkg) { return function (cb) {
    chain
      ( [lifecycle, pkg, "install"]
      , [lifecycle, pkg, "postinstall"]
      , [autoActivate, pkg]
      , [autoUpdate, pkg]
      , cb
      )
  }}).concat(args.map(function (pkg) {
    pkg = pkg && pkg._data || pkg
    return [ log, "Success: "+(pkg.name + "@"+pkg.version), "build" ]
  })).concat(cb))
}
