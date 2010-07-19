
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

module.exports = build

// pkg is either a "package" folder, or a package.json data obj, or an
// object that has the package.json data on the _data member.
function build (args, cb) {
  readAll(args, function (er, args) {
    if (er) return cb(er)
    var c = args.map(function (a) {
      return [buildStep, a]
    })
    c.push([linkDependencies, args], cb)
    chain(c)
  })
}

function buildStep (pkg, cb) {
  pkg = pkg && pkg._data || pkg
  if (!pkg) return cb(new Error("Invalid package data "+sys.inspect(pkg)))

  var ROOT = npm.root
    , npmdir = npm.dir

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

      // run the "install" lifecycle script
    , [lifecycle, pkg, "install"]
    , [lifecycle, pkg, "postinstall"]

      // If this is the only version, and auto-activate is true
      // then activate this package and version
    , [autoActivate, pkg]

      // success!
    , function (cb) {
        log("Success: "+pkg._id, "build")
        cb()
      }

    , cb
    )
}

function autoActivate (pkg, cb) {
  var auto = npm.config.get("auto-activate")
  if (!auto) {
    log("auto-activate disabled by config", "auto-activate")
    return cb()
  }
  // get the list of versions of this package.
  fs.readdir(path.join(npm.dir, pkg.name), function (er, versions) {
    if (er) return cb(er)
    if (auto !== "always" && versions.indexOf("active") !== -1) {
      log("another version already active", "auto-activate")
      log("to activate, do:   npm activate "+
        pkg.name+" "+pkg.version, "auto-activate")
      return cb()
    }
    log(pkg.name+" "+pkg.version, "activate")
    npm.commands.activate([pkg.name, pkg.version], cb)
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
        log(reqs, "reqs to find")
        ;(function R (req) {
          if (!req) {
            log(found, "reqs found")
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
  args.forEach(function (pkg) {
    if (!pkg._resolvedDeps || !pkg._resolvedDeps.length) return undefined
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
  var c = pkg._resolvedDeps.map(function (dep) {
    log(dep, "add dependent link")
    var dependents = path.join(npm.dir, dep.name, dep.version, "dependents")
      , to = path.join(dependents, pkg.name + "-" + pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version)
    return [link, from, to]
  })
  c.push(cb)
  return chain(c)
}
function dependencyLink (pkg, cb) {
  if (!pkg._resolvedDeps || !pkg._resolvedDeps.length) return cb()


  var c = pkg._resolvedDeps.map(function (dep) { return function (cb) {
    pkg.link = pkg.link || {}
    var dependencies = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
      , fromLib = path.join(npm.root, dep.name + "-" + dep.version)
      , fromMain = fromLib + ".js"
      , toLib = path.join(dependencies, dep.name)
      , toMain = toLib+".js"
      , linkToLib = (dep.name in pkg.link)
        ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[dep.name])
        : null
      , linkToMain = linkToLib ? linkToLib + ".js" : null
      , c = [ [ linkIfExists, fromMain, toMain ]
            , [ linkIfExists, fromLib, toLib ]
            ]
    if (linkToLib) c.push( [ linkIfExists, fromLib, linkToLib ] )
    if (linkToMain) c.push( [ linkIfExists, fromMain, linkToMain ] )
    c.push(cb)
    chain(c)
  }})
  c.push(cb)
  chain(c)
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
  log(pkg._id, "linkLib")
  var lib = pkg.directories && pkg.directories.lib || pkg.lib
  if (!lib) return cb()
  var from = path.join(npm.dir, pkg.name, pkg.version, "package", lib)
    , toInternal = path.join(npm.dir, pkg.name, pkg.version, "lib")
    , to = path.join(npm.root, pkg.name+"-"+pkg.version)

  function doLink (er) {
    if (er) return cb(er)
    chain
      ( [rm, toInternal]
      , [rm, to]
      , function (cb) { fs.symlink(from, toInternal, function (er) {
          if (er) return cb(er)
          fs.symlink(toInternal, to, cb)
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
  log(pkg._id, "linkMain")
  if (!pkg.main) return cb()
  var from = path.join(npm.dir, pkg.name, pkg.version, "main.js")
    , to = path.join(npm.root, pkg.name+"-"+pkg.version+".js")
  fs.lstat(to, function (er) {
    if (!er) rm(to, function (er) {
      log("clobbered, try again", "linkMain")
      if (er) cb(er)
      else linkMain(pkg, cb)
    })
    else fs.symlink(from, to, cb)
  })
}

function linkBins (pkg, cb) {
  log(pkg._id, "linkBins")
  if (!pkg.bin) return cb()
  var binroot = npm.config.get("binroot")
    , steps = []
    , dep = path.join(npm.dir, pkg.name, pkg.version, "dependencies")
  if (!process.env.PATH || -1 === process.env.PATH.indexOf(binroot)) {
    log("bins installing to "+binroot+", outside PATH", "warning")
  }
  for (var i in pkg.bin) if (i.charAt(0) !== "_") {
    log(i+" "+pkg.bin[i], "linkBin")
    var to = path.join(binroot, i+"-"+pkg.version)
      , from = path.join(npm.dir, pkg.name, pkg.version, "package", pkg.bin[i])
    steps.push([shimTest, from, to, dep])
  }
  steps.push(function (er) {
    if (er) log("failed", "linkBins")
    else log("succeeded", "linkBins")
    cb(er)
  })
  chain(steps)
}

function shimTest (from, to, dep, cb) {
  // if it needs a shim, then call writeShim
  // otherwise, just link it in.
  if (from.match(/\.(node|js)$/)) return writeShim(from, to, dep, cb)
  fs.readFile(from, function (er, data) {
    if (er) return cb(er)
    var envNode = from.match(/#!(\/usr\/bin\/)?env node/)
      , node = from.match(/#!(\/usr(\/local)?\/bin\/)?node/)
    if (envNode && envNode.index === 0 || node && node.index === 0) {
      return writeShim(from, to, dep, cb)
    }
    return link(from, to, cb)
  })
}

function linkIfExists (from, to, cb) {
  fs.stat(from, function (er) {
    if (er) return cb()
    link(from, to, cb)
  })
}

function link (from, to, cb) {
  chain
    ( [log, from+" --> "+to, "link"]
    , [fs, "stat", from]
    , [rm, to]
    , [mkdir, path.dirname(to)]
    , [fs, "symlink", from, to]
    , log.er(cb, "linking "+from+" to "+to, "failed")
    )
}
