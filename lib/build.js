
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

module.exports = build

// pkg is either a "package" folder, or a package.json data obj, or an
// object that has the package.json data on the _data member.
function build (args, cb) {
  if (args.length > 1) {
    ;(function B (p) {
      if (!p) return cb()
      build([p], function (er, ok) {
        if (er) return cb(er)
        B(args.shift())
      })
    })(args.shift())
  }
  var pkg = args[0]
  if (!pkg) cb()

  // if pkg isn't an object, then parse the package.json inside it, and build with that.
  if (typeof pkg === "string") {
    log(pkg, "build")
    return readAndBuild(pkg, cb)
  }

  pkg = pkg && pkg._data || pkg

  if (!pkg) return cb(new Error("Invalid package data "+sys.inspect(pkg)))

  var ROOT = npm.root
    , npmdir = npm.dir

  // at this point, presumably the filesystem knows how to open it.
  chain
    ( [lifecycle, pkg, "preinstall"]
      // link deps into ROOT/.npm/{name}/{version}/dependencies
      // this is then added to require.paths, but ONLY for this package's main module.
      // of course, they could do require(".npm/foo/1.0.3/dependencies/bar") to import
      // whichever version of bar is currently satisfying foo-1.0.3's need.
      // For now, all dependencies must already be installed, or the install fails.
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

function readAndBuild (folder, cb) {
  readJson(path.join(folder, "package.json"), function (er, data) {
    if (er) cb(er)
    else build([data], cb)
  })
}

// make sure that all the dependencies have been installed.
// todo: if they're not, then install them, and come back here.
function resolveDependencies (pkg, topCb) {
  if (!pkg) return cb(new Error("Package not found to resolve dependencies"))
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
          if (!req) return cb()
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
      // for all the found ones, make a note that this package depends on it
      // this is important for safe uninstallation
    , function (cb) {
        var deps = found.slice(0)
        ;(function L (dep) {
          if (!dep) return cb()
          // link from ROOT/.npm/{dep.name}/{dep.version}/dependents/{pkg}-{version}
          // to the package folder being installed.
          var dependents = path.join(npm.dir, dep.name, dep.version, "dependents")
            , to = path.join(dependents, pkg.name + "-" + pkg.version)
            , from = path.join(npm.dir, pkg.name, pkg.version)
          chain
            ( [mkdir, dependents]
            , [rm, to] // should be rare
            , [fs, "symlink", from, to]
            , cb
            )
        })(deps.pop())
      }
    , function (cb) {
        // link in all the found reqs.
        ;(function L (req) {
          if (!req) return cb()

          log(req.name+ "-" +req.version, "found")

          // link ROOT/.npm/{pkg}/{version}/dependencies/{req.name} to
          // ROOT/{req.name}-{req.version}
          // both the JS and the folder, if they're there
          // then try again with the next req.
          pkg.link = pkg.link || {}
          var to = path.join(npm.dir, pkg.name, pkg.version, "dependencies", req.name)
            , linkDepTo = (req.name in pkg.link)
              ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[req.name])
              : null
            , from = path.join(npm.root, req.name + "-" + req.version)
          function link_ (cb) {
            fs.stat(from, function (er, stat) {
              if (er) return cb()
              link(from, to, function (er) {
                if (er) return cb(er)
                if (linkDepTo) link(from, linkDepTo, cb)
                else cb()
              })
            })
          }

          chain
            ( link_
            , function (cb) {
                from += ".js"
                to += ".js"
                if (linkDepTo) linkDepTo += ".js"
                cb()
              }
            , link_
            , function (er) {
                if (er) return topCb(er)
                L(found.pop())
              }
            )
        })(found.pop())
      }
    , topCb
    )
}

function writeShim (from, to, dep, cb) {
  if (!cb) cb = dep, dep = false
  
  var nodePath = process.execPath
               || path.join(process.installPrefix, "bin", "node")
    , code = "#!"+nodePath+"\n"
           + "// generated by npm, please don't touch!\n"
           + (dep
             ? "require.paths.unshift(" + JSON.stringify(dep) + ")\n"
             : "")
           + "module.exports = require("
           + JSON.stringify(from.replace(/\.(js|node)$/, ''))
           + ")\n"
           + (dep ? "require.paths.shift()\n" : "\n")
  fs.writeFile(to, code, "ascii", function (er, ok) {
    if (er) return cb(er)
    fs.chmod(to, 0755, cb)
  })
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
  var lib = pkg.directories && pkg.directories.lib || pkg.lib || false
    , defLib = (lib === false)
  if (defLib) lib = "lib"

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
    if (er) return (!defLib) ? cb(new Error("Libs dir not found "+from)) : cb()
    if (!s.isDirectory()) {
      if (!defLib) cb(new Error("Libs dir not a dir: "+lib))
      else cb()
    } else {
      // make sure that it doesn't already exist.  If so, rm it.
      fs.lstat(to, function (er, s) {
        if (!er) {
          fs.unlink(to, doLink)
        } else doLink()
      })
    }
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

function link (from, to, cb) {
  chain
    ( [fs, "stat", from]
    , [rm, to]
    , [mkdir, path.dirname(to)]
    , [fs, "symlink", from, to]
    , function (er) {
        if (er) log("linking "+from+" to "+to, "failed")
        cb(er)
      }
    )
}
