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
  mapToRegistry("-/short", npm.config, function (shortEr, shortUri) {
    if (shortEr) return cb(shortEr)

    registry.get(shortUri, null, function (getShortEr, pkgs) {
      if (getShortEr) return cb()
      if (!opts.partialWord) return cb(null, pkgs)

      var name = npa(opts.partialWord).name
      pkgs = pkgs.filter(function (p) {
        return p.indexOf(name) === 0
      })

      if (pkgs.length !== 1 && opts.partialWord === name) {
        return cb(null, pkgs)
      }

      mapToRegistry(pkgs[0], npm.config, function (fullEr, fullUri) {
        if (fullEr) return cb(fullEr)

        registry.get(fullUri, null, function (getFullEr, d) {
          if (getFullEr) return cb()
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

// system packages
var fs = require("fs")
var path = require("path")

// dependencies
var log = require("npmlog")
var readPackageTree = require("read-package-tree")
var chain = require("slide").chain
var archy = require("archy")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")
var clone = require("lodash.clonedeep")
var npa = require("npm-package-arg")
var iferr = require("iferr")

// npm internal utils
var npm = require("./npm.js")
var mapToRegistry = require("./utils/map-to-registry.js")
var locker = require("./utils/locker.js")
var lock = locker.lock
var unlock = locker.unlock

// install specific libraries
var inflateShrinkwrap = require("./install/inflate-shrinkwrap.js")
var loadDeps = require("./install/deps.js").loadDeps
var loadDevDeps = require("./install/deps.js").loadDevDeps
var loadRequestedDeps = require("./install/deps.js").loadRequestedDeps
var diffTrees = require("./install/diff-trees.js")
var decomposeActions = require("./install/decompose-actions.js")
var validateTree = require("./install/validate-tree.js")
var saveRequested = require("./install/save.js").saveRequested
var getSaveType = require("./install/save.js").getSaveType
var actions = require("./install/actions.js").actions
var doSerial = require("./install/actions.js").doSerial
var doParallel = require("./install/actions.js").doParallel

function unlockCB (lockPath, name, cb) {
  return function (installEr) {
    var args = arguments
    try {
      unlock(lockPath, name, reportErrorAndReturn)
    }
    catch (unlockEx) {
      process.nextTick(function() {
        reportErrorAndReturn(unlockEx)
      })
    }
    function reportErrorAndReturn(unlockEr) {
      if (installEr) {
        if (unlockEr && unlockEr.code !== "ENOTLOCKED") {
          log.warn("unlock"+name, unlockEr)
        }
        return cb.apply(null, args)
      }
      if (unlockEr) return cb(unlockEr)
      return cb.apply(null, args)
    }
  }
}

function install (args, cb) {
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, "..")

  // internal api: install(where, what, cb)
  if (arguments.length === 3) {
    where = args
    args = [].concat(cb) // pass in [] to do default dep-install
    cb = arguments[2]
    log.verbose("install", "where, what", [where, args])
  }

  if (!npm.config.get("global")) {
    args = args.filter(function (a) {
      return path.resolve(a) !== where
    })
  }

  // this is where we keep and pass information about the ongoing
  // install from step to step. It can contain:
  //   installState.currentTree -- What's on disk right now
  //   installState.idealTree -- What we want to be on disk
  //   installState.differences -- The logical differences between the trees
  //   installState.todo -- Steps to convert currentTree into idealTree
  //   installState.completion -- a map of completion groups
  var installState = {}

  var completion = installState.completion = {
    loadCurrentTree:       log.newGroup("loadCurrentTree",4),
    loadIdealTree:         log.newGroup("loadIdealTree",12),
    generateActionsToTake: log.newGroup("generateActionsToTake"),
    executeActions:        log.newGroup("executeActions", 8),
    runTopLevelLifecycles: log.newGroup("runTopLevelLifecycles", 2)
  }

  var steps = []
  steps.push(
    [loadCurrentTree, where, args, installState],
    [finishTracker(completion.loadCurrentTree)],

    [loadIdealTree, args, installState],
    [finishTracker(completion.loadIdealTree)],

    [debugTree, "currentTree", installState, "currentTree"],
    [debugTree, "idealTree", installState, "idealTree"],

    [generateActionsToTake, installState],
    [finishTracker(completion.generateActionsToTake)],

    [debugActions,  "diffTrees", installState, "differences"],
    [debugActions, "decomposeActions", installState, "todo"],

    [executeActions, where, installState],
    [finishTracker(completion.executeActions)],

    [runTopLevelLifecycles, args, installState],
    [finishTracker(completion.runTopLevelLifecycles)])

  if (getSaveType(args)) steps.push(
    [saveToDependencies, installState])

  steps.push(
    [printInstalled, installState, where])

  chain(steps, cb)
}

function finishTracker (tracker) {
  return function (cb) {
    tracker.finish()
    cb()
  }
}

function loadCurrentTree (where, args, installState, cb) {
  chain([
    [readLocalPackageData, where, args, installState],
    [normalizeTree, installState]
  ], cb)
}

function loadIdealTree (args, installState, cb) {
  var completion = installState.completion
  var short = completion.loadIdealTree.newItem("loadIdealTree", 2)
  completion.loadAllDepsIntoIdealTree = completion.loadIdealTree.newGroup("loadAllDepsIntoIdealTree",10)
  chain([
    [cloneCurrentTreeToIdealTree, installState],
    [function (cb) { cb(null, short.completeWork(1)) }],
    [loadShrinkwrap, installState],
    [function (cb) { cb(null, short.completeWork(1)) }],
    [loadAllDepsIntoIdealTree, args, installState]
  ], cb)
}

function loadAllDepsIntoIdealTree (args, installState, cb) {
  var idealTree = installState.idealTree
  var saveDeps = getSaveType(args)

  var dev = npm.config.get("dev") || !npm.config.get("production")

  var cg = installState.completion.loadAllDepsIntoIdealTree

  var steps = []

  steps.push( args.length
    ? [loadRequestedDeps, args, idealTree, saveDeps, cg.newGroup("loadRequestedDeps")]
    : [loadDeps, idealTree, cg.newGroup("loadDeps")])
  if (dev) steps.push(
    [loadDevDeps, idealTree, cg.newGroup("loadDevDeps")])
  chain(steps, cb)
}

function generateActionsToTake (installState, cb) {
  var currentTree = installState.currentTree
  var idealTree = installState.idealTree
  var cg = installState.completion.generateActionsToTake
  installState.differences = []
  var todo = installState.todo = []
  chain([
    [validateTree, idealTree, cg.newGroup("validateTree")],
    [diffTrees, currentTree, idealTree, installState.differences, cg.newGroup("diffTrees")],
    [decomposeActions, installState.differences, todo, cg.newGroup("decomposeActions")]
  ], cb)
}

function executeActions (where, installState, cb) {
  var todo = installState.todo
  var cg = installState.completion.executeActions

  var node_modules = path.resolve(where, "node_modules")
  var staging = path.resolve(node_modules, ".staging")
  var steps = []
  var trackLifecycle = cg.newGroup("lifecycle")

  cb = unlockCB(node_modules, ".staging", cb)

  steps.push(
    [doParallel, "fetch", staging, todo, cg.newGroup("fetch", 10)],
    [lock, node_modules, ".staging"],
    [rimraf, staging],
    [mkdirp, staging],
    [doParallel, "extract", staging, todo, cg.newGroup("extract", 10)],
    [doParallel, "preinstall", staging, todo, trackLifecycle.newGroup("preinstall")],
    [doParallel, "remove", staging, todo, cg.newGroup("remove")],
    [doSerial,   "finalize", staging, todo, cg.newGroup("finalize")],
    [doParallel, "build", staging, todo, trackLifecycle.newGroup("build")],
    [doSerial,   "install", staging, todo, trackLifecycle.newGroup("install")],
    [doSerial,   "postinstall", staging, todo, trackLifecycle.newGroup("postinstall")])
  if (npm.config.get("npat")) steps.push(
    [doParallel, "test", staging, todo, trackLifecycle.newGroup("npat")])
  steps.push(
    // TODO add check that .staging is empty? DUBIOUS
    [rimraf, staging])

  chain(steps, cb)
}

function runTopLevelLifecycles (args, installState, cb) {
  var steps = []

  var idealTree = installState.idealTree
  var where = idealTree.realpath
  var trackLifecycle = installState.completion.runTopLevelLifecycles

  if (!args.length) steps.push(
    [actions.preinstall, where, idealTree, trackLifecycle.newGroup("preinstall:.")],
    [actions.build, where, idealTree, trackLifecycle.newGroup("build:.")],
    [actions.postinstall, where, idealTree, trackLifecycle.newGroup("postinstall:.")])
  if (!args.length && npm.config.get("npat")) steps.push(
    [actions.test, where, idealTree, trackLifecycle.newGroup("npat:.")])
  if (!npm.config.get("production")) steps.push(
    [actions.prepublish, where, idealTree, trackLifecycle.newGroup("prepublish")])

  chain(steps, cb)
}

function saveToDependencies (installState, cb) {
  var idealTree = installState.idealTree
  saveRequested(idealTree, cb)
}

function readLocalPackageData (where, args, installState, cb) {
  readPackageTree(where, iferr(cb,function (currentTree) {
    installState.currentTree = currentTree
    if (!args.length && !currentTree.package) {
      log.error("install", "Couldn't read dependencies")
      var er = new Error("ENOENT, open '"+path.join(where, "package.json")+"'")
      er.code = "ENOPACKAGEJSON"
      er.errno = 34
      return cb(er)
    }
    if (!currentTree.package) currentTree.package = {}
    if (currentTree.package._shrinkwrap) return cb()
    fs.readFile(path.join(where, "npm-shrinkwrap.json"), {encoding:"utf8"}, function (er, data) {
      if (er) return cb()
      try {
        currentTree.package._shrinkwrap = JSON.parse(data)
      }
      catch (ex) {
        return cb(ex)
      }
      return cb()
    })
  }))

}

function cloneCurrentTreeToIdealTree (installState, cb) {
  installState.idealTree = clone(installState.currentTree)
  cb()
}

function loadShrinkwrap (installState, cb) {
  var idealTree = installState.idealTree
  if (!idealTree.package._shrinkwrap) return cb()
  inflateShrinkwrap(idealTree, idealTree.package._shrinkwrap.dependencies, cb)
}

function normalizeTree (installState, cb) {
  doNormalizeTree(installState.currentTree)
  function doNormalizeTree(tree) {
    if (!tree.package.dependencies) tree.package.dependencies = {}
    tree.children.forEach(function (dep) {
      doNormalizeTree(dep)
    })
  }
  cb()
}

function printInstalled (installState, where, cb) {
  var differences = installState.differences
  log.clearProgress()
  /*
  TODO: What we actually want to do here is build a tree of installed modules.
  Tricky due to the fact that we can have empty layers. Need to scan up to find the next installed module.
  Since actions include actual link to the point in the tree that we need, we can flag modules
  as installed.
  */
  differences.forEach(function (action) {
    var mutation = action[0]
    if (mutation === "add" || mutation === "update") mutation = "+"
    else if (mutation === "remove") mutation = "-"
    var child = action[1]
    var name = child.package.name+"@"+child.package.version
    console.log(mutation + " " + name + " " + path.relative(where, child.path))
  })
  log.showProgress()
  cb()
}

function debugActions (name, installState, actionListName, cb) {
  var actionsToLog = installState[actionListName]
  log.silly(name, "action count", actionsToLog.length)
  actionsToLog.forEach(function (action) {
    log.silly(name, action.map(function (value) {
      return (value && value.package) ? value.package.name + "@" + value.package.version : value
    }).join(" "))
  })
  cb()
}

// This takes an object and a property name instead of a value to allow us
// to define the arguments for use by chain before the property exists yet.
function debugTree (name, installState, treeName, cb) {
  log.silly(name, prettify(installState[treeName]).trim())
  cb()
}

function prettify (tree) {
  function byName (aa,bb) {
    return aa.package.name.localeCompare(bb)
  }
  return archy( {
    label: tree.package.name + "@" + tree.package.version
           + " " + tree.path,
    nodes: (tree.children || []).sort(byName).map(function expandChild (child) {
      return {
        label: child.package.name + "@" + child.package.version,
        nodes: child.children.sort(byName).map(expandChild)
      }
    })
  }, "", { unicode: npm.config.get("unicode") })
}
