'use strict'
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
module.exports.Installer = Installer

install.usage = '\nnpm install (with no args, in package dir)' +
                '\nnpm install [<@scope>/]<pkg>' +
                '\nnpm install [<@scope>/]<pkg>@<tag>' +
                '\nnpm install [<@scope>/]<pkg>@<version>' +
                '\nnpm install [<@scope>/]<pkg>@<version range>' +
                '\nnpm install <folder>' +
                '\nnpm install <tarball file>' +
                '\nnpm install <tarball url>' +
                '\nnpm install <git:// url>' +
                '\nnpm install <github username>/<github project>' +
                '\n\nalias: npm i' +
                '\ncommon options: [--save|--save-dev|--save-optional] [--save-exact]'

install.completion = function (opts, cb) {
  validate('OF', arguments)
  // install can complete to a folder with a package.json, or any package.
  // if it has a slash, then it's gotta be a folder
  // if it starts with https?://, then just give up, because it's a url
  if (/^https?:\/\//.test(opts.partialWord)) {
    // do not complete to URLs
    return cb(null, [])
  }

  if (/\//.test(opts.partialWord)) {
    // Complete fully to folder if there is exactly one match and it
    // is a folder containing a package.json file.  If that is not the
    // case we return 0 matches, which will trigger the default bash
    // complete.
    var lastSlashIdx = opts.partialWord.lastIndexOf('/')
    var partialName = opts.partialWord.slice(lastSlashIdx + 1)
    var partialPath = opts.partialWord.slice(0, lastSlashIdx)
    if (partialPath === '') partialPath = '/'

    var annotatePackageDirMatch = function (sibling, cb) {
      var fullPath = path.join(partialPath, sibling)
      if (sibling.slice(0, partialName.length) !== partialName) {
        return cb(null, null) // not name match
      }
      fs.readdir(fullPath, function (err, contents) {
        if (err) return cb(null, { isPackage: false })

        cb(
          null,
          {
            fullPath: fullPath,
            isPackage: contents.indexOf('package.json') !== -1
          }
        )
      })
    }

    return fs.readdir(partialPath, function (err, siblings) {
      if (err) return cb(null, []) // invalid dir: no matching

      asyncMap(siblings, annotatePackageDirMatch, function (err, matches) {
        if (err) return cb(err)

        var cleaned = matches.filter(function (x) { return x !== null })
        if (cleaned.length !== 1) return cb(null, [])
        if (!cleaned[0].isPackage) return cb(null, [])

        // Success - only one match and it is a package dir
        return cb(null, [cleaned[0].fullPath])
      })
    })
  }

  // FIXME: there used to be registry completion here, but it stopped making
  // sense somewhere around 50,000 packages on the registry
  cb()
}

// system packages
var fs = require('fs')
var path = require('path')

// dependencies
var log = require('npmlog')
var readPackageTree = require('read-package-tree')
var chain = require('slide').chain
var asyncMap = require('slide').asyncMap
var archy = require('archy')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var clone = require('lodash.clonedeep')
var iferr = require('iferr')
var validate = require('aproba')

// npm internal utils
var npm = require('./npm.js')
var locker = require('./utils/locker.js')
var lock = locker.lock
var unlock = locker.unlock

// install specific libraries
var inflateShrinkwrap = require('./install/inflate-shrinkwrap.js')
var recalculateMetadata = require('./install/deps.js').recalculateMetadata
var loadDeps = require('./install/deps.js').loadDeps
var loadDevDeps = require('./install/deps.js').loadDevDeps
var loadRequestedDeps = require('./install/deps.js').loadRequestedDeps
var loadExtraneous = require('./install/deps.js').loadExtraneous
var pruneTree = require('./install/prune-tree.js')
var diffTrees = require('./install/diff-trees.js')
var decomposeActions = require('./install/decompose-actions.js')
var validateTree = require('./install/validate-tree.js')
var saveRequested = require('./install/save.js').saveRequested
var getSaveType = require('./install/save.js').getSaveType
var doSerialActions = require('./install/actions.js').doSerial
var doParallelActions = require('./install/actions.js').doParallel
var doOneAction = require('./install/actions.js').doOne

function unlockCB (lockPath, name, cb) {
  validate('SSF', arguments)
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

function install (where, args, cb) {
  if (!cb) {
    cb = args
    args = where
    where = null
  }
  if (!where) {
    where = npm.config.get('global')
          ? path.resolve(npm.globalDir, '..')
          : npm.prefix
  }
  validate('SAF', [where, args, cb])
  // the /path/to/node_modules/..
  var dryrun = !!npm.config.get('dry-run')

  if (!npm.config.get('global')) {
    args = args.filter(function (a) {
      return path.resolve(a) !== npm.prefix
    })
  }

  new Installer(where, dryrun, args).run(cb)
}

function Installer (where, dryrun, args) {
  validate('SBA', arguments)
  this.where = where
  this.dryrun = dryrun
  this.args = args
  this.currentTree = null
  this.idealTree = null
  this.differences = []
  this.todo = []
  this.progress = {}
  this.noPackageJsonOk = !!args.length
  this.topLevelLifecycles = !args.length
  this.npat = npm.config.get('npat')
  this.dev = !npm.config.get('production')
}
Installer.prototype = {}

Installer.prototype.run = function (cb) {
  validate('F', arguments)
  this.newTracker(log, 'loadCurrentTree', 4)
  this.newTracker(log, 'loadIdealTree', 12)
  this.newTracker(log, 'generateActionsToTake')
  this.newTracker(log, 'executeActions', 8)
  this.newTracker(log, 'runTopLevelLifecycles', 2)

  var steps = []
  steps.push(
    [this, this.loadCurrentTree],
    [this, this.finishTracker, 'loadCurrentTree'],

    [this, this.loadIdealTree],
    [this, this.finishTracker, 'loadIdealTree'],

    [this, this.debugTree, 'currentTree', 'currentTree'],
    [this, this.debugTree, 'idealTree', 'idealTree'],

    [this, this.generateActionsToTake],
    [this, this.finishTracker, 'generateActionsToTake'],

    [this, this.debugActions, 'diffTrees', 'differences'],
    [this, this.debugActions, 'decomposeActions', 'todo'])
  if (!this.dryrun) {
    steps.push(
      [this, this.executeActions],
      [this, this.finishTracker, 'executeActions'],

      [this, this.runTopLevelLifecycles],
      [this, this.finishTracker, 'runTopLevelLifecycles'])

    if (getSaveType(this.args)) {
      steps.push(
        [this, this.saveToDependencies])
    }
  }
  steps.push(
    [this, this.printInstalled])

  chain(steps, cb)
}

Installer.prototype.newTracker = function (tracker, name, size) {
  validate('OS', [tracker, name])
  if (size) validate('N', [size])
  this.progress[name] = tracker.newGroup(name, size)
}

Installer.prototype.finishTracker = function (tracker, cb) {
  validate('SF', arguments)
  this.progress[tracker].finish()
  cb()
}

Installer.prototype.loadCurrentTree = function (cb) {
  validate('F', arguments)
  chain([
    [this, this.readLocalPackageData],
    [this, this.normalizeTree, log.newGroup('normalizeTree')]
  ], cb)
}

Installer.prototype.loadIdealTree = function (cb) {
  validate('F', arguments)
  this.newTracker(this.progress.loadIdealTree, 'cloneCurrentTree')
  this.newTracker(this.progress.loadIdealTree, 'loadShrinkwrap')
  this.newTracker(this.progress.loadIdealTree, 'loadAllDepsIntoIdealTree', 10)
  chain([
    [this, this.cloneCurrentTreeToIdealTree],
    [this, this.finishTracker, 'cloneCurrentTree'],
    [this, this.loadShrinkwrap],
    [this, this.finishTracker, 'loadShrinkwrap'],
    [this, this.loadAllDepsIntoIdealTree],
    [this, function (next) { next(pruneTree(this.idealTree)) } ]
  ], cb)
}

Installer.prototype.loadAllDepsIntoIdealTree = function (cb) {
  validate('F', arguments)
  var saveDeps = getSaveType(this.args)

  var dev = npm.config.get('dev') || !npm.config.get('production')

  var cg = this.progress.loadAllDepsIntoIdealTree
  var installNewModules = !!this.args.length
  var steps = []

  if (installNewModules) {
    steps.push(
      [loadRequestedDeps, this.args, this.idealTree, saveDeps, cg.newGroup('loadRequestedDeps')])
  } else {
    steps.push(
      [loadDeps, this.idealTree, cg.newGroup('loadDeps')])
    if (dev) {
      steps.push(
        [loadDevDeps, this.idealTree, cg.newGroup('loadDevDeps')])
    }
  }
  steps.push(
    [loadExtraneous, this.idealTree, cg.newGroup('loadExtraneous')])
  chain(steps, cb)
}

Installer.prototype.generateActionsToTake = function (cb) {
  validate('F', arguments)
  var cg = this.progress.generateActionsToTake
  chain([
    [validateTree, this.idealTree, cg.newGroup('validateTree')],
    [diffTrees, this.currentTree, this.idealTree, this.differences, cg.newGroup('diffTrees')],
    [decomposeActions, this.differences, this.todo, cg.newGroup('decomposeActions')]
  ], cb)
}

Installer.prototype.executeActions = function (cb) {
  validate('F', arguments)
  var todo = this.todo
  var cg = this.progress.executeActions

  var node_modules = path.resolve(this.where, 'node_modules')
  var staging = path.resolve(node_modules, '.staging')
  var steps = []
  var trackLifecycle = cg.newGroup('lifecycle')

  cb = unlockCB(node_modules, '.staging', cb)

  steps.push(
    [doParallelActions, 'fetch', staging, todo, cg.newGroup('fetch', 10)],
    [lock, node_modules, '.staging'],
    [rimraf, staging],
    [mkdirp, staging],
    [doParallelActions, 'extract', staging, todo, cg.newGroup('extract', 10)],
    [doParallelActions, 'preinstall', staging, todo, trackLifecycle.newGroup('preinstall')],
    [doSerialActions, 'remove', staging, todo, cg.newGroup('remove')],
    [doSerialActions, 'move', staging, todo, cg.newGroup('move')],
    [doSerialActions, 'finalize', staging, todo, cg.newGroup('finalize')],
    [doParallelActions, 'build', staging, todo, trackLifecycle.newGroup('build')],
    [doSerialActions, 'install', staging, todo, trackLifecycle.newGroup('install')],
    [doSerialActions, 'postinstall', staging, todo, trackLifecycle.newGroup('postinstall')])
  if (this.npat) {
    steps.push(
      [doParallelActions, 'test', staging, todo, trackLifecycle.newGroup('npat')])
  }
  steps.push(
    // TODO add check that .staging is empty? DUBIOUS
    [rimraf, staging])

  chain(steps, cb)
}

Installer.prototype.runTopLevelLifecycles = function (cb) {
  validate('F', arguments)
  var steps = []
  var trackLifecycle = this.progress.runTopLevelLifecycles
  if (!this.topLevelLifecycles) {
    trackLifecycle.finish()
    return cb()
  }

  steps.push(
    [doOneAction, 'preinstall', this.idealTree.path, this.idealTree, trackLifecycle.newGroup('preinstall:.')],
    [doOneAction, 'build', this.idealTree.path, this.idealTree, trackLifecycle.newGroup('build:.')],
    [doOneAction, 'postinstall', this.idealTree.path, this.idealTree, trackLifecycle.newGroup('postinstall:.')])
  if (this.npat) {
    steps.push(
      [doOneAction, 'test', this.idealTree.path, this.idealTree, trackLifecycle.newGroup('npat:.')])
  }
  if (this.dev) {
    steps.push(
      [doOneAction, 'prepublish', this.idealTree.path, this.idealTree, trackLifecycle.newGroup('prepublish')])
  }
  chain(steps, cb)
}

Installer.prototype.saveToDependencies = function (cb) {
  validate('F', arguments)
  saveRequested(this.args, this.idealTree, cb)
}

Installer.prototype.readLocalPackageData = function (cb) {
  validate('F', arguments)
  var self = this
  readPackageTree(this.where, iferr(cb, function (currentTree) {
    self.currentTree = currentTree
    if (!self.noPackageJsonOk && !currentTree.package) {
      log.error('install', "Couldn't read dependencies")
      var er = new Error("ENOENT, open '" + path.join(self.where, 'package.json') + "'")
      er.code = 'ENOPACKAGEJSON'
      er.errno = 34
      return cb(er)
    }
    if (!currentTree.package) currentTree.package = {}
    if (currentTree.package._shrinkwrap) return cb()
    fs.readFile(path.join(self.where, 'npm-shrinkwrap.json'), {encoding: 'utf8'}, function (er, data) {
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

Installer.prototype.cloneCurrentTreeToIdealTree = function (cb) {
  validate('F', arguments)
  this.idealTree = clone(this.currentTree)
  cb()
}

Installer.prototype.loadShrinkwrap = function (cb) {
  validate('F', arguments)
  if (!this.idealTree.package._shrinkwrap || this.idealTree.package._shrinkwrap.dependencies) return cb()
  inflateShrinkwrap(this.idealTree, this.idealTree.package._shrinkwrap.dependencies, cb)
}

Installer.prototype.normalizeTree = function (log, cb) {
  validate('OF', arguments)
  recalculateMetadata(this.currentTree, log, iferr(cb, function (tree) {
    tree.children.forEach(function (child) {
      if (child.package._requiredBy.length === 0) {
        child.package._requiredBy.push('#EXISTING')
      }
    })
    cb(null, tree)
  }))
}

Installer.prototype.printInstalled = function (cb) {
  validate('F', arguments)
  log.clearProgress()
  /*
  TODO: What we actually want to do here is build a tree of installed modules.
  Tricky due to the fact that we can have empty layers. Need to scan up to find the next installed module.
  Since actions include actual link to the point in the tree that we need, we can flag modules
  as installed.
  */
  var self = this
  this.differences.forEach(function (action) {
    var mutation = action[0]
    if (mutation === 'add' || mutation === 'update') mutation = '+'
    else if (mutation === 'remove') mutation = '-'
    else if (mutation === 'move') mutation = '>'
    var child = action[1]
    var name = child.package.name + '@' + child.package.version
    console.log(mutation + ' ' + name + ' ' + path.relative(self.where, child.path))
  })
  log.showProgress()
  cb()
}

Installer.prototype.debugActions = function (name, actionListName, cb) {
  validate('SSF', arguments)
  var actionsToLog = this[actionListName]
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
Installer.prototype.debugTree = function (name, treeName, cb) {
  validate('SSF', arguments)
  log.silly(name, this.prettify(this[treeName]).trim())
  cb()
}

Installer.prototype.prettify = function (tree) {
  validate('O', arguments)
  function byName (aa, bb) {
    return aa.package.name.localeCompare(bb)
  }
  return archy({
    label: tree.package.name + '@' + tree.package.version +
           ' ' + tree.path,
    nodes: (tree.children || []).sort(byName).map(function expandChild (child) {
      return {
        label: child.package.name + '@' + child.package.version,
        nodes: child.children.sort(byName).map(expandChild)
      }
    })
  }, '', { unicode: npm.config.get('unicode') })
}
