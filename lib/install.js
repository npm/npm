"use strict"
// npm install <pkg> <pkg> <pkg>
//
// See doc/install.md for more description

// Managing contexts...
// there's a lot of state associated with an "install" operation, including
// packages that are already installed, parent packages, current shrinkwrap, and
// so on. We maintain this state in a "context" object that gets passed around.
// every time we dive into a deeper node_modules folder, the "family" list that
// gets passed along uses the previous "family" list as its __proto__.  Any
// "resolved precise dependency" things that aren't already on this object get
// added, and then that's passed to the next generation of installation.

module.exports = install

install.usage = "npm install"
              + "\nnpm install <pkg>"
              + "\nnpm install <pkg>@<tag>"
              + "\nnpm install <pkg>@<version>"
              + "\nnpm install <pkg>@<version range>"
              + "\nnpm install <folder>"
              + "\nnpm install <tarball file>"
              + "\nnpm install <tarball url>"
              + "\nnpm install <git:// url>"
              + "\nnpm install <github username>/<github project>"
              + "\n\nCan specify one or more: npm install ./foo.tgz bar@stable /some/folder"
              + "\nIf no argument is supplied and ./npm-shrinkwrap.json is "
              + "\npresent, installs dependencies specified in the shrinkwrap."
              + "\nOtherwise, installs dependencies from ./package.json."

install.completion = function (opts, cb) {
  // install can complete to a folder with a package.json, or any package.
  // if it has a slash, then it's gotta be a folder
  // if it starts with https?://, then just give up, because it's a url
  // for now, not yet implemented.
  var registry = npm.registry
  mapToRegistry("-/short", npm.config, function (er, uri) {
    if (er) return cb(er)

    registry.get(uri, null, function (er, pkgs) {
      if (er) return cb()
      if (!opts.partialWord) return cb(null, pkgs)

      var name = npa(opts.partialWord).name
      pkgs = pkgs.filter(function (p) {
        return p.indexOf(name) === 0
      })

      if (pkgs.length !== 1 && opts.partialWord === name) {
        return cb(null, pkgs)
      }

      mapToRegistry(pkgs[0], npm.config, function (er, uri) {
        if (er) return cb(er)

        registry.get(uri, null, function (er, d) {
          if (er) return cb()
          return cb(null, Object.keys(d["dist-tags"] || {})
                    .concat(Object.keys(d.versions || {}))
                    .map(function (t) {
                      return pkgs[0] + "@" + t
                    }))
        })
      })
    })
  })
}

var npm = require("./npm.js")
  , log = require("npmlog")
  , readPackageTree = require("read-package-tree")
  , chain = require("slide").chain
  , archy = require("archy")
  , mkdir = require("mkdirp")
  , rimraf = require("rimraf")
  , fs = require("graceful-fs")
  , locker = require("./utils/locker.js")
  , lock = locker.lock
  , unlock = locker.unlock
  , url = require("url")
  , path = require("path")
  , loadDeps = require("./install/deps.js").loadDeps
  , loadDevDeps = require("./install/deps.js").loadDevDeps
  , loadArgs = require("./install/deps.js").loadArgs
  , diffTrees = require("./install/diff-trees.js")
  , decomposeActions = require("./install/decompose-actions.js")
  , actions = require("./install/actions.js").actions
  , doSerial = require("./install/actions.js").doSerial
  , doParallel = require("./install/actions.js").doParallel
  , validateTree = require("./install/validate-tree.js")

function dup(stuff) {
  return JSON.parse(JSON.stringify(stuff))
}

function unlockcb(path, name, cb) {
  return function (er1) {
    var args = arguments
    unlock(path, name, function (er2) {
      if (er1) {
        if (er2) log.warning("unlock "+namej,er2)
        return cb.apply(null, args)
      }
      if (er2) return cb(er2)
      cb.apply(null, args)
    })
  }
}

function beforeCb(cb, before) {
  return function () {
    before()
    cb.apply(null, arguments)
  }
}

function install(args, cb) {
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, "..")

  // internal api: install(where, what, cb)
  if (arguments.length === 3) {
    where = args
    args = [].concat(cb) // pass in [] to do default dep-install
    cb = arguments[2]
    log.verbose("install", "where, what", [where, args])
  }

  cb = beforeCb(cb, function () {
    if (Math.round(log.tracker.completed()) != 1) console.log(log.tracker.debug())
  })

  if (!npm.config.get("global")) {
    args = args.filter(function (a) {
      return path.resolve(a) !== where
    })
  }

  var node_modules = path.resolve(where, "node_modules")
  var staging = path.resolve(node_modules, ".staging")

  cb = unlockcb(node_modules, ".staging", cb)

  chain([
      [lock, node_modules, ".staging"]
    , [rimraf, staging]
    , [readPackageTree, where]
    , [debugTree, 'RPT', chain.last]
    , (npm.config.get("shrinkwrap") !== false) && [readShrinkwrap, chain.last, where]
    ], thenInstall(node_modules, staging, args, cb))
}

function thenInstall(node_modules, staging, args, cb) {
  return function (er, results) {
      if (er) return cb(er)
      var currentTree = results.pop()
      doInstall(currentTree, node_modules, staging, args, cb)
  }}

function doInstall(currentTree, node_modules, staging, args, cb) {
  var idealTree = dup(currentTree)

  // If we're run without arguments, we update everything
  if (!args.length) idealTree.children = []

  var fast = log.newGroup("fast")
  var lifecycle = log.newGroup("lifecycle")
  var toplifecycle = lifecycle.newGroup("top")
  var finalize = log.newGroup("finalize")
  var move = log.newGroup("placement")

  var dev = npm.config.get("dev") || ! npm.config.get("production")

  var todo = []
  var steps =
    [ [mkdir, staging]
    , [loadDeps, idealTree, log.newGroup("loadDeps")]//, [debugTree, "loadDeps", idealTree]
    , args.length && [loadArgs, args, idealTree, log.newGroup("loadArgs", 2)]//, [debugTree, "loadArgs", idealTree]
    //, [dedupTree, idealTree]//, [debugTree, "dedupTree", idealTree]
    , dev && [loadDevDeps, idealTree, log.newGroup("loadDevDeps", 5)]//, [debugTree, "loadDevDeps", idealTree]
    , [validateTree, idealTree, log.newGroup("validateTree")],
    , [diffTrees, currentTree, idealTree, todo, fast.newGroup("diffTrees")]//, [debugActions, log, "diffTrees", todo]
    , [decomposeActions, todo, fast.newGroup("decomposeActions")]//, [debugActions, log, "decomposeActions", todo]
    , [doParallel, "fetch", staging, todo, log.newGroup("fetch", 10)]
    , [doParallel, "extract", staging, todo, log.newGroup("extract", 10)]
    , [doParallel, "preinstall", staging, todo, lifecycle.newGroup("preinstall")]
    , [doParallel, "build", staging, todo, lifecycle.newGroup("build")]
    , [doParallel, "remove", staging, todo, move.newGroup("remove")]
    , [doSerial, "finalize", staging, todo, move.newGroup("finalize")]
    , [doSerial, "install", staging, todo, lifecycle.newGroup("install")]
    , [doSerial, "postinstall", staging, todo, lifecycle.newGroup("postinstall")]
    , npm.config.get("npat") && [doParallel, "test", staging, todo, lifecycle.newGroup("npat")]
    , [rimraf, staging]
    , [unlock, node_modules, ".staging"]
    , ! args.length && [actions.preinstall, idealTree.realpath, idealTree, toplifecycle.newGroup("preinstall:.")]
    , ! args.length && [actions.build, idealTree.realpath, idealTree, toplifecycle.newGroup("build:.")]
    , ! args.length && [actions.postinstall, idealTree.realpath, idealTree, toplifecycle.newGroup("postinstall:.")]
    , ! args.length && npm.config.get("npat") &&
                       [actions.test, idealTree.realpath, idealTree, toplifecycle.newGroup("npat:.")]
    , ! npm.config.get("production") && [actions.prepublish, idealTree.realpath, idealTree, toplifecycle.newGroup("prepublish")]
    ]
  chain(steps, cb)
}

function readShrinkwrap(currentTree, where, cb) {
  var wrapfile = path.resolve(where, "npm-shrinkwrap.json")

  fs.readFile(wrapfile, "utf8", function (er, wrapjson) {
    if (er) return cb()
    log.verbose("readShrinkwrap", "npm-shrinkwrap.json is overriding dependencies")
    try {
      var newwrap = JSON.parse(wrapjson)
    } catch (ex) {
      return cb(ex)
    }

    log.info("shrinkwrap", "file %j", wrapfile)
    var dependencies = currentTree.package.dependencies = {}
    Object.keys(newwrap.dependencies || {}).forEach(function (key) {
      dependencies[key] = readWrap(newwrap.dependencies[key])
    })
    return cb()
  })
}

function readWrap (w) {
  return (w.resolved) ? w.resolved
       : (w.from && url.parse(w.from).protocol) ? w.from
       : w.version
}

function debugActions(log, name, actions, cb) {
  actions.forEach(function(A) {
    log.verbose(name, A.map(function(V){
      return (V && V.package) ? V.package.name + "@" + V.package.version : V
    }).join(" "))
  })
  cb()
}

function debugTracker(cb) {
  log.clearProgress()
  console.error(log.tracker.debug())
  log.showProgress()
  cb()
}

function debugTree(name,tree,cb) {
  log.verbose(name, prettify(tree).trim())
  log.verbose(name, require('util').inspect(tree))
  cb()
}

function prettify(tree) {
  var byName = function (A,B){
    return A.package.name > B.package.name ? 1 :
           A.package.name < B.package.name ? -1 : 0
  }
  return archy(
    { label: tree.package.name + "@" + tree.package.version
             + " " + tree.path
    , nodes: (tree.children || []).sort(byName).map(function P (c) {
        return {
          label: c.package.name + "@" + c.package.version
        , nodes: c.children.sort(byName).map(P)
        }
      })
    }, "", { unicode: npm.config.get("unicode") })
}
