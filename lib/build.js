
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
  , fs = require("./utils/graceful-fs")
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
  , asyncMap = require("./utils/async-map")

module.exports = build

// pkg is either a "package" folder, or a package.json data obj, or an
// object that has the package.json data on the _data member.
function build (args, cb) {
  readAll(args, function (er, args) {
    if (er) return cb(er)
    // do all preinstalls, then check deps, then install all, then finish up.
    chain
      ( [asyncMap, args, function (a, cb) {
          return lifecycle(a, "preinstall", cb)
        }]
      , [asyncMap, args, function (a, cb) {
          return resolveDependencies(a, cb)
        }]
      , [asyncMap, args, buildStep, 2]
      , [linkDependencies, args]
      , [finishBuild, args]
      , cb
      )
  })
}

function buildStep (pkg, cb) {
  pkg = pkg && pkg._data || pkg
  if (!pkg) return cb(new Error("Invalid package data "+sys.inspect(pkg)))
  linkModules(pkg, path.join(npm.root, pkg.name+"-"+pkg.version), cb)
  linkBins(pkg, cb)
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

function readAll (folders, cb) {
  var data = []
    , errState = null
    , f = folders.length
  asyncMap(folders, function (folder, cb) {
    if (typeof folder === "object") return cb(null, folder)
    readJson(path.join(folder, "package.json"), function (er, d) {
      // FIXME: in 0.3.0, remove this, and make it the default
      // behavior in read-json.js
      if (!er && d.main && d.modules && d.modules.index) delete d.main
      cb(er, d)
    })
  }, cb)
}

// make sure that all the dependencies have been installed.
function resolveDependencies (pkg, cb) {
  if (!pkg) return topCb(new Error("Package not found to resolve dependencies"))
  // link foo-1.0.3 to ROOT/.npm/{pkg}/{version}/dependencies/foo

  asyncMap(pkg.dependencies && Object.keys(pkg.dependencies), function (i, cb) {
    var req = { name:i, version:pkg.dependencies[i] }
    log(req.name+"-"+req.version, "required")
    // see if we have this thing installed.
    fs.readdir(path.join(npm.dir, req.name), function (er, versions) {
      if (er) return cb(new Error(
        "Required package: "+req.name+"("+req.version+") not found."))
      // TODO: Get the "stable" version if there is one.
      // Look that up from the registry.
      var satis = semver.maxSatisfying(versions, req.version)
      if (satis) return cb(null, {name:req.name, version:satis})
      return cb(new Error(
        "Required package: "+req.name+"("+req.version+") not found. "+
        "(Found: "+JSON.stringify(versions)+")"))
    })
  }, function (er, found) {
    // save the resolved dependencies on the pkg data for later
    pkg._resolvedDeps = found
    cb(er, found)
  })
}

function linkDependencies (args, cb) {
  // at this point, we know that all the packages in the "args" list have
  // been installed, and so have all the dependencies in each of their
  // _resolvedDeps array.
  // link each package's _resolvedDeps properly.
  asyncMap(args, function (pkg, cb) {
    dependentLink(pkg, cb)
    dependencyLink(pkg, cb)
  }, 2, cb)
}
// for each dependency, link this pkg into the proper "dependent" folder
function dependentLink (pkg, cb) {
  asyncMap(pkg._resolvedDeps, function (dep, cb) {
    var dependents = path.join(npm.dir, dep.name, dep.version, "dependents")
      , to = path.join(dependents, pkg.name + "-" + pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version)
    link(from, to, cb)
  }, cb)
}


// link each dep into this pkg's "dependencies" folder
function dependencyLink (pkg, cb) {
  pkg.link = pkg.link || {}
  var dependencies = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
  asyncMap(pkg._resolvedDeps, function (dep, cb) {
    var dependsOn = path.join( npm.dir, pkg.name, pkg.version
                             , "dependson", dep.name + "-" + dep.version
                             )
      , fromRoot = path.join(npm.dir, dep.name, dep.version)
      , fromLib = path.join(npm.root, dep.name + "-" + dep.version)
      , toLib = path.join(dependencies, dep.name)
      , linkToLib = (dep.name in pkg.link)
        ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[dep.name])
        : null
    linkModules(dep, toLib, cb)
    linkToLib ? linkModules(dep, linkToLib, cb) : cb()
    link(fromRoot, dependsOn, cb)
  }, 3, cb)
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
  
  var versionDir = path.join(npm.dir, pkg.name, pkg.version)
    , pkgDir = path.join(versionDir, "package")

  asyncMap(mod && Object.keys(mod), function (key, cb) {
    writeShim
      ( path.join(pkgDir, mod[key])
      , path.join(target, key.replace(/\.js$/, '')+".js")
      , path.join(versionDir, "dependencies")
      , cb
      )
  }, cb)
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
  walk(libDir, function (er, filenames) {
    if (er) return cb(er)
    filenames.forEach(function (filename) {
      filename = filename.replace(/\.(js|node)$/, '')
      pkg.modules[filename.substr(libDir.length + 1)] = filename.substr(pkgDir.length + 1)
    })
    linkModules(pkg, target, cb)
  })
}
function walk (dir, cb) {
  var filenames = []
  fs.stat(dir, function (er, stats) {
    if (er) return cb(er)
    if (!stats.isDirectory()) return cb(new Error(
      "Not a dir, can't walk:"+dir))
    fs.readdir(dir, function (er, files) {
      asyncMap(files, function (f, cb) {
        f = path.join(dir, f)
        fs.stat(f, function (er, s) {
          if (er) return cb() // don't include missing files, but don't abort either
          if (s.isDirectory()) return walk(f, cb)
          if (f.match(/\.(js|node)$/)) cb(null, f)
          else cb()
        })
      }, cb)
    })
  })
}
///// end
///// DEPRECATED
///// FIXME: remove by 0.1.30
/////



function linkBins (pkg, cb) {
  if (!pkg.bin) return cb()
  log(pkg._id, "linkBins")
  var binroot = npm.config.get("binroot")
    , dep = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
  if (!binroot) return cb()
  if (!process.env.PATH || -1 === process.env.PATH.indexOf(binroot)) {
    log.warn("bins installing to "+binroot+", outside PATH")
  }
  asyncMap(Object.keys(pkg.bin).filter(function (i) {
    return i.charAt(0) !== "_"
  }), function (i, cb) {
    log(i+" "+pkg.bin[i], "linkBin")
    var to = path.join(binroot, i+"-"+pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version, "package", pkg.bin[i])
    shimTest(from, to, dep, cb)
  }, log.er(cb, "failed to link bins"))
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
