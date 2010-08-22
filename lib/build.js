
// npm build command

// everything about the installation after the creation of
// the .npm/{name}/{version}/package folder.
// linking the modules into the npm.root,
// resolving dependencies, etc.

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

      // shim ROOT/.npm/{name}-{version}/{module-name}
      // to ROOT/.npm/{name}/{version}/package/{module}
    , [linkModules, pkg, path.join(npm.root, pkg.name+"-"+pkg.version)]

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
    if (!maxHave) return cb()
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

function readAll (folders, cb_) {
  var data = []
    , errState = null
    , f = folders.length
  folders.forEach(function (folder) {
    if (typeof folder === "object") return cb(null, folder)
    readJson(path.join(folder, "package.json"), cb)
  })
  function cb (er, d) {
    if (errState) return
    if (er) return cb_(errState = er)
    // FIXME: in 0.3.0, remove this, and make it the default
    // behavior in read-json.js
    if (d.main && d.modules && d.modules.index) delete d.main
    data.push(d)
    if (-- f === 0) return cb_(er, data)
  }
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
  // TODO: don't serialize.  Just do them all.
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
  // TODO: don't serialize.  Just do them all.
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
      , toLib = path.join(dependencies, dep.name)
      , linkToLib = (dep.name in pkg.link)
        ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[dep.name])
        : null
    chain([ [ mkdir, dependsOn ]
          , [ link, fromRoot, dependsOn ]
          , [ linkModules, dep, toLib ]
          , linkToLib && [ linkModules, dep, linkToLib ]
          , cb
          ].filter(function (_) { return _ }))
  }}).concat(cb))
}

// shim {target}/{module-name} to ROOT/.npm/{name}/{version}/package/{module-path}
function linkModules (pkg, target, cb) {
  var mod = pkg.modules
  if (!mod) {
    var lib = pkg.directories && pkg.directories.lib || pkg.lib
    if (lib) {
      log.warn( "Auto-linking the 'directories.lib' is deprecated and will be removed.\n"
              + "Use the package 'modules' feature instead."
              )
      return linkDefaultModules(pkg, lib, target, cb)
    }
  }

  // FIXME: remove in 0.3.0, and uncomment this functionality in lib/utils/read-json.js
  if (pkg.main) {
    if (!pkg.modules) pkg.modules = mod = {}
    mod.index = pkg.main
    delete pkg.main
  }
  
  if (!pkg.modules) return cb()

  var versionDir = path.join(npm.dir, pkg.name, pkg.version)
    , pkgDir = path.join(versionDir, "package")

  var modKeys = Object.keys(mod)
    , m = modKeys.length
    , errState = null
  function cb_ (er) {
    if (errState) return
    if (er) return cb(errState = er)
    if (-- m === 0) return cb()
  }
  modKeys.forEach(function (key) {
    var value = mod[key]
      , from = path.join(pkgDir, value)
      , dep = path.join(versionDir, "dependencies")
      , to = path.join(target, key+".js")
    shim(from, to, dep, cb_)
  })
}

/////
///// DEPRECATED
///// FIXME: remove by 0.2.0
/////
// shim ROOT/{name}-{version}/**/*.js to ROOT/.npm/{name}/{version}/{lib}/**/*.js
function linkDefaultModules(pkg, lib, target, cb) {
  var pkgDir = path.join(npm.dir, pkg.name, pkg.version, "package")
    , libDir = path.join(pkgDir, lib)

  // create a modules hash from the lib folder.
  // this sucks, and is going away eventually.
  pkg.modules = {}
  walk(libDir).map(function (filename) {
    filename = filename.replace(/\.(js|node)$/, '')
    pkg.modules[filename.substr(libDir.length + 1)] = filename.substr(pkgDir.length + 1)
  })
  return linkModules(pkg, target, cb)
}
function walk (filename) {
  var filenames = []
    , stats = fs.statSync(filename)
  if(stats.isFile() && filename.match(/\.(js|node)$/)) {
    // Filename
    filenames.push(filename)
  } else if (stats.isDirectory()) {
    // Directory - walk recursive
    var files = fs.readdirSync(filename)
    for (var i = 0; i < files.length; i++) {
      walk(filename + '/' + files[i]).forEach(function (fn) {
        filenames.push(fn)
      })
    }
  }
  return filenames
}
///// end
///// DEPRECATED
///// FIXME: remove by 0.1.30
/////



function shim (from, to, dep, cb) {
  fs.lstat(to, function (er) {
    if (!er) rm(to, function (er) {
      if (er) cb(er)
      else shim(from, to, dep, cb)
    })
    else {
      writeShim(from, to, dep, cb)
    }
  })
}

function linkBins (pkg, cb) {
  if (!pkg.bin) return cb()
  log(pkg._id, "linkBins")
  var binroot = npm.config.get("binroot")
    , dep = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
  if (!binroot) return cb()
  if (!process.env.PATH || -1 === process.env.PATH.indexOf(binroot)) {
    log.warn("bins installing to "+binroot+", outside PATH")
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
