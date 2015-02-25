// remove a package.

module.exports = uninstall

uninstall.usage = 'npm uninstall <name>[@<version> [<name>[@<version>] ...]' +
                  '\nnpm rm <name>[@<version> [<name>[@<version>] ...]'

uninstall.completion = require('./utils/completion/installed-shallow.js')

// system packages
var fs = require('fs')
var path = require('path')

// dependencies
var log = require('npmlog')
var readPackageTree = require('read-package-tree')
var chain = require('slide').chain
var archy = require('archy')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var clone = require('lodash.clonedeep')
var iferr = require('iferr')

// npm internal utils
var npm = require('./npm.js')
var locker = require('./utils/locker.js')
var lock = locker.lock
var unlock = locker.unlock

// install specific libraries
var inflateShrinkwrap = require('./install/inflate-shrinkwrap.js')
var removeDeps = require('./install/deps.js').removeDeps
var loadExtraneous = require('./install/deps.js').loadExtraneous
var diffTrees = require('./install/diff-trees.js')
var decomposeActions = require('./install/decompose-actions.js')
var validateTree = require('./install/validate-tree.js')
var saveRequested = require('./install/save.js').saveRequested
var getSaveType = require('./install/save.js').getSaveType
var actions = require('./install/actions.js').actions
var doSerial = require('./install/actions.js').doSerial
var doParallel = require('./install/actions.js').doParallel

function unlockCB (lockPath, name, cb) {
  return function (installEr) {
    var args = arguments
    try {
      unlock(lockPath, name, reportErrorAndReturn)
    } catch (unlockEx) {
      process.nextTick(function () {
        reportErrorAndReturn(unlockEx)
      })
    }
    function reportErrorAndReturn (unlockEr) {
      if (installEr) {
        if (unlockEr && unlockEr.code !== 'ENOTLOCKED') {
          log.warn('unlock' + name, unlockEr)
        }
        return cb.apply(null, args)
      }
      if (unlockEr) return cb(unlockEr)
      return cb.apply(null, args)
    }
  }
}

function uninstall (args, cb) {
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, '..')

  if (!npm.config.get('global')) {
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
    loadCurrentTree:       log.newGroup('loadCurrentTree',4),
    loadIdealTree:         log.newGroup('loadIdealTree',12),
    generateActionsToTake: log.newGroup('generateActionsToTake'),
    executeActions:        log.newGroup('executeActions', 8),
    runTopLevelLifecycles: log.newGroup('runTopLevelLifecycles', 2)
  }

  var steps = []
  steps.push(
    [loadCurrentTree, where, args, installState],
    [finishTracker(completion.loadCurrentTree)],

    [loadIdealTree, args, installState],
    [finishTracker(completion.loadIdealTree)],

    [debugTree, 'currentTree', installState, 'currentTree'],
    [debugTree, 'idealTree', installState, 'idealTree'],

    [generateActionsToTake, installState],
    [finishTracker(completion.generateActionsToTake)],

    [debugActions, 'diffTrees', installState, 'differences'],
    [debugActions, 'decomposeActions', installState, 'todo'],

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
  var short = completion.loadIdealTree.newItem('loadIdealTree', 2)
  completion.loadAllDepsIntoIdealTree = completion.loadIdealTree.newGroup('loadAllDepsIntoIdealTree',10)
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

  var cg = installState.completion.loadAllDepsIntoIdealTree

  var steps = []

  steps.push(
    [removeDeps, args, idealTree, saveDeps, cg.newGroup('removeDeps')])
  steps.push(
    [loadExtraneous, idealTree, cg.newGroup('loadExtraneous')])
  chain(steps, cb)
}

function generateActionsToTake (installState, cb) {
  var currentTree = installState.currentTree
  var idealTree = installState.idealTree
  var cg = installState.completion.generateActionsToTake
  installState.differences = []
  var todo = installState.todo = []
  chain([
    [validateTree, idealTree, cg.newGroup('validateTree')],
    [diffTrees, currentTree, idealTree, installState.differences, cg.newGroup('diffTrees')],
    [decomposeActions, installState.differences, todo, cg.newGroup('decomposeActions')]
  ], cb)
}

function executeActions (where, installState, cb) {
  var todo = installState.todo
  var cg = installState.completion.executeActions

  var node_modules = path.resolve(where, 'node_modules')
  var staging = path.resolve(node_modules, '.staging')
  var steps = []
  var trackLifecycle = cg.newGroup('lifecycle')

  cb = unlockCB(node_modules, '.staging', cb)

  steps.push(
    [doParallel, 'fetch', staging, todo, cg.newGroup('fetch', 10)],
    [lock, node_modules, '.staging'],
    [rimraf, staging],
    [mkdirp, staging],
    [doParallel, 'extract', staging, todo, cg.newGroup('extract', 10)],
    [doParallel, 'preinstall', staging, todo, trackLifecycle.newGroup('preinstall')],
    [doParallel, 'remove', staging, todo, cg.newGroup('remove')],
    [doSerial, 'finalize', staging, todo, cg.newGroup('finalize')],
    [doParallel, 'build', staging, todo, trackLifecycle.newGroup('build')],
    [doSerial, 'install', staging, todo, trackLifecycle.newGroup('install')],
    [doSerial, 'postinstall', staging, todo, trackLifecycle.newGroup('postinstall')])
  if (npm.config.get('npat')) steps.push(
    [doParallel, 'test', staging, todo, trackLifecycle.newGroup('npat')])
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
    [actions.preinstall, where, idealTree, trackLifecycle.newGroup('preinstall:.')],
    [actions.build, where, idealTree, trackLifecycle.newGroup('build:.')],
    [actions.postinstall, where, idealTree, trackLifecycle.newGroup('postinstall:.')])
  if (!args.length && npm.config.get('npat')) steps.push(
    [actions.test, where, idealTree, trackLifecycle.newGroup('npat:.')])
  if (!npm.config.get('production')) steps.push(
    [actions.prepublish, where, idealTree, trackLifecycle.newGroup('prepublish')])

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
      log.error('install', 'Couldn\'t read dependencies')
      var er = new Error('ENOENT, open \'' + path.join(where, 'package.json') + '\'')
      er.code = 'ENOPACKAGEJSON'
      er.errno = 34
      return cb(er)
    }
    if (!currentTree.package) currentTree.package = {}
    if (currentTree.package._shrinkwrap) return cb()
    fs.readFile(path.join(where, 'npm-shrinkwrap.json'), {encoding:'utf8'}, function (er, data) {
      if (er) return cb()
      try {
        currentTree.package._shrinkwrap = JSON.parse(data)
      } catch (ex) {
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
  function doNormalizeTree (tree) {
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
    if (mutation === 'add' || mutation === 'update') mutation = '+'
    else if (mutation === 'remove') mutation = '-'
    var child = action[1]
    var name = child.package.name + '@' + child.package.version
    console.log(mutation + ' ' + name + ' ' + path.relative(where, child.path))
  })
  log.showProgress()
  cb()
}

function debugActions (name, installState, actionListName, cb) {
  var actionsToLog = installState[actionListName]
  log.silly(name, 'action count', actionsToLog.length)
  actionsToLog.forEach(function (action) {
    log.silly(name, action.map(function (value) {
      return (value && value.package) ? value.package.name + '@' + value.package.version : value
    }).join(' '))
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
  return archy({
    label: tree.package.name + '@' + tree.package.version + ' ' + tree.path,
    nodes: (tree.children || []).sort(byName).map(function expandChild (child) {
      return {
        label: child.package.name + '@' + child.package.version,
        nodes: child.children.sort(byName).map(expandChild)
      }
    })
  }, '', { unicode: npm.config.get('unicode') })
}
