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
var ls = require('./ls.js')

// install specific libraries
var readShrinkwrap = require('./install/read-shrinkwrap.js')
var recalculateMetadata = require('./install/deps.js').recalculateMetadata
var loadDeps = require('./install/deps.js').loadDeps
var loadDevDeps = require('./install/deps.js').loadDevDeps
var loadRequestedDeps = require('./install/deps.js').loadRequestedDeps
var loadExtraneous = require('./install/deps.js').loadExtraneous
var pruneTree = require('./install/prune-tree.js')
var diffTrees = require('./install/diff-trees.js')
var checkPermissions = require('./install/check-permissions.js')
var decomposeActions = require('./install/decompose-actions.js')
var filterInvalidActions = require('./install/filter-invalid-actions.js')
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

  if (npm.config.get('global') && !args.length) {
    args = ['.']
  }
  args = args.filter(function (a) {
    return path.resolve(a) !== npm.prefix
  })

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
  this.dev = npm.config.get('dev') || !npm.config.get('production')
  this.rollback = npm.config.get('rollback')
  this.link = npm.config.get('link')
}
Installer.prototype = {}

Installer.prototype.run = function (cb) {
  validate('F', arguments)

  var installSteps = []
  var postInstallSteps = []
  installSteps.push(
    [this.newTracker(log, 'loadCurrentTree', 4)],
    [this, this.loadCurrentTree],
    [this, this.finishTracker, 'loadCurrentTree'],

    [this.newTracker(log, 'loadIdealTree', 12)],
    [this, this.loadIdealTree],
    [this, this.finishTracker, 'loadIdealTree'],

    [this, this.debugTree, 'currentTree', 'currentTree'],
    [this, this.debugTree, 'idealTree', 'idealTree'],

    [this.newTracker(log, 'generateActionsToTake')],
    [this, this.generateActionsToTake],
    [this, this.finishTracker, 'generateActionsToTake'],

    [this, this.debugActions, 'diffTrees', 'differences'],
    [this, this.debugActions, 'decomposeActions', 'todo'])
  if (!this.dryrun) {
    installSteps.push(
      [this.newTracker(log, 'executeActions', 8)],
      [this, this.executeActions],
      [this, this.finishTracker, 'executeActions'])
    var node_modules = path.resolve(this.where, 'node_modules')
    var staging = path.resolve(node_modules, '.staging')
    postInstallSteps.push(
      [this.newTracker(log, 'rollbackFailedOptional', 1)],
      [this, this.rollbackFailedOptional, staging, this.todo],
      [this, this.finishTracker, 'rollbackFailedOptional'],
      [this.newTracker(log, 'runTopLevelLifecycles', 2)],
      [this, this.runTopLevelLifecycles],
      [this, this.finishTracker, 'runTopLevelLifecycles'])

    if (getSaveType(this.args)) {
      postInstallSteps.push(
        [this, this.saveToDependencies])
    }
  }
  postInstallSteps.push(
    [this, this.printInstalled])

  var self = this
  chain(installSteps, function (installEr) {
    if (installEr) self.failing = true
    chain(postInstallSteps, function (postInstallEr) {
      if (self.idealTree) {
        self.idealTree.warnings.forEach(function (warning) {
          log.warn(warning.code, warning.message)
        })
      }
      if (installEr && postInstallEr) {
        log.warn('error', postInstallEr.message)
        log.verbose('error', postInstallEr.stack)
      }
      cb(installEr || postInstallEr, self.idealTree)
    })
  })
}

Installer.prototype.newTracker = function (tracker, name, size) {
  validate('OS', [tracker, name])
  if (size) validate('N', [size])
  this.progress[name] = tracker.newGroup(name, size)
  var self = this
  return function (next) {
    self.progress[name].silly(name, 'Starting')
    next()
  }
}

Installer.prototype.finishTracker = function (name, cb) {
  validate('SF', arguments)
  this.progress[name].silly(name, 'Finishing')
  this.progress[name].finish()
  cb()
}

Installer.prototype.loadCurrentTree = function (cb) {
  validate('F', arguments)
  log.silly('install', 'loadCurrentTree')
  chain([
    [this, this.readLocalPackageData],
    [this, this.normalizeTree, log.newGroup('normalizeTree')]
  ], cb)
}

Installer.prototype.loadIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('install', 'loadIdealTree')

  chain([
    [this.newTracker(this.progress.loadIdealTree, 'cloneCurrentTree')],
    [this, this.cloneCurrentTreeToIdealTree],
    [this, this.finishTracker, 'cloneCurrentTree'],

    [this.newTracker(this.progress.loadIdealTree, 'loadShrinkwrap')],
    [this, this.loadShrinkwrap],
    [this, this.finishTracker, 'loadShrinkwrap'],

    [this.newTracker(this.progress.loadIdealTree, 'loadAllDepsIntoIdealTree', 10)],
    [this, this.loadAllDepsIntoIdealTree],
    [this, this.finishTracker, 'loadAllDepsIntoIdealTree'],

    [this, function (next) { recalculateMetadata(this.idealTree, log, next) } ],
    [this, this.debugTree, 'idealTree:prePrune', 'idealTree'],
    [this, function (next) { next(pruneTree(this.idealTree)) } ]
  ], cb)
}

Installer.prototype.loadAllDepsIntoIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('install', 'loadAllDepsIntoIdealTree')
  var saveDeps = getSaveType(this.args)

  var cg = this.progress.loadAllDepsIntoIdealTree
  var installNewModules = !!this.args.length
  var steps = []

  if (installNewModules) {
    steps.push([loadRequestedDeps, this.args, this.idealTree, saveDeps, cg.newGroup('loadRequestedDeps')])
    if (npm.config.get('global')) {
      steps.push([this, this.filterGlobalTrees])
    }
  } else {
    steps.push(
      [loadDeps, this.idealTree, cg.newGroup('loadDeps')])
    if (this.dev) {
      steps.push(
        [loadDevDeps, this.idealTree, cg.newGroup('loadDevDeps')])
    }
  }
  steps.push(
    [loadExtraneous.andResolveDeps, this.idealTree, cg.newGroup('loadExtraneous')])
  chain(steps, cb)
}

Installer.prototype.filterGlobalTrees = function (cb) {
  validate('F', arguments)
  log.silly('install', 'filterGlobalTrees')
  var modules = {}
  this.idealTree.children = this.idealTree.children.filter(function (child) {
    if (child.isGlobal) { modules[child.package.name] = true }
    return child.isGlobal
  })
  this.currentTree.children = this.currentTree.children.filter(function (child) {
    return modules[child.package.name]
  })
  cb()
}

Installer.prototype.generateActionsToTake = function (cb) {
  validate('F', arguments)
  log.silly('install', 'generateActionsToTake')
  var cg = this.progress.generateActionsToTake
  chain([
    [validateTree, this.idealTree, cg.newGroup('validateTree')],
    [diffTrees, this.currentTree, this.idealTree, this.differences, cg.newGroup('diffTrees')],
    [this, this.computeLinked],
    [filterInvalidActions, this.where, this.differences],
    [checkPermissions, this.differences],
    [decomposeActions, this.differences, this.todo]
  ], cb)
}

Installer.prototype.computeLinked = function (cb) {
  validate('F', arguments)
  if (!this.link || npm.config.get('global')) return cb()
  var linkTodoList = []
  var self = this
  asyncMap(this.differences, function (action, next) {
    var cmd = action[0]
    var pkg = action[1]
    if (cmd !== 'add' && cmd !== 'update') return next()
    var isReqByTop = pkg.package._requiredBy.filter(function (name) { return name === '/' }).length
    var isReqByUser = pkg.package._requiredBy.filter(function (name) { return name === '#USER' }).length
    var isExtraneous = pkg.package._requiredBy.length === 0
    if (!isReqByTop && !isReqByUser && !isExtraneous) return next()
    isLinkable(pkg, function (install, link) {
      if (install) linkTodoList.push(['global-install', pkg])
      if (link) linkTodoList.push(['global-link', pkg])
      if (install || link) {
        pkg.parent.children = pkg.parent.children.filter(function (child) { return child !== pkg })
      }
      next()
    })
  }, function () {
    if (linkTodoList.length === 0) return cb()
    pruneTree(self.idealTree)
    self.differences.length = 0
    Array.prototype.push.apply(self.differences, linkTodoList)
    diffTrees(self.currentTree, self.idealTree, self.differences, log.newGroup('d2'), cb)
  })
}

function safeJSONparse (data) {
  try {
    return JSON.parse(data)
  } catch (ex) {
    return
  }
}

function isLinkable (pkg, cb) {
  var globalPackage = path.resolve(npm.globalPrefix, 'lib', 'node_modules', pkg.package.name)
  var globalPackageJson = path.resolve(globalPackage, 'package.json')
  fs.stat(globalPackage, function (er) {
    if (er) return cb(true, true)
    fs.readFile(globalPackageJson, function (er, data) {
      var json = safeJSONparse(data)
      cb(false, json && json.version === pkg.package.version)
    })
  })
}

Installer.prototype.executeActions = function (cb) {
  validate('F', arguments)
  log.silly('install', 'executeActions')
  var todo = this.todo
  var cg = this.progress.executeActions

  var node_modules = path.resolve(this.where, 'node_modules')
  var staging = path.resolve(node_modules, '.staging')
  var steps = []
  var trackLifecycle = cg.newGroup('lifecycle')

  cb = unlockCB(node_modules, '.staging', cb)

  steps.push(
    [doSerialActions, 'global-install', staging, todo, trackLifecycle.newGroup('global-install')],
    [doParallelActions, 'fetch', staging, todo, cg.newGroup('fetch', 10)],
    [lock, node_modules, '.staging'],
    [rimraf, staging],
    [mkdirp, staging],
    [doParallelActions, 'extract', staging, todo, cg.newGroup('extract', 10)],
    [doParallelActions, 'preinstall', staging, todo, trackLifecycle.newGroup('preinstall')],
    [doSerialActions, 'remove', staging, todo, cg.newGroup('remove')],
    [doSerialActions, 'move', staging, todo, cg.newGroup('move')],
    [doSerialActions, 'finalize', staging, todo, cg.newGroup('finalize')],
    [doSerialActions, 'build', staging, todo, trackLifecycle.newGroup('build')],
    [doSerialActions, 'global-link', staging, todo, trackLifecycle.newGroup('global-link')],
    [doParallelActions, 'update-linked', staging, todo, trackLifecycle.newGroup('update-linked')],
    [doSerialActions, 'install', staging, todo, trackLifecycle.newGroup('install')],
    [doSerialActions, 'postinstall', staging, todo, trackLifecycle.newGroup('postinstall')])
  if (this.npat) {
    steps.push(
      [doParallelActions, 'test', staging, todo, trackLifecycle.newGroup('npat')])
  }

  var self = this
  chain(steps, function (er) {
    if (!er || self.rollback) {
      rimraf(staging, function () { cb(er) })
    } else {
      cb(er)
    }
  })
}

Installer.prototype.rollbackFailedOptional = function (staging, actionsToRun, cb) {
  if (!this.rollback) return cb()
  var failed = actionsToRun.map(function (action) { return action[1] }).filter(function (pkg) { return pkg.failed && pkg.rollback })
  asyncMap(failed, function (pkg, next) {
    asyncMap(pkg.rollback, function (rollback, done) {
      rollback(staging, pkg, done)
    }, next)
  }, cb)
}

Installer.prototype.runTopLevelLifecycles = function (cb) {
  validate('F', arguments)
  if (this.failing) return cb()
  log.silly('install', 'runTopLevelLifecycles')
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
  log.silly('install', 'saveToDependencies')
  saveRequested(this.args, this.idealTree, cb)
}

Installer.prototype.readLocalPackageData = function (cb) {
  validate('F', arguments)
  log.silly('install', 'readLocalPackageData')
  var self = this
  mkdirp(this.where, iferr(cb, function () {
    readPackageTree(self.where, iferr(cb, function (currentTree) {
      self.currentTree = currentTree
      self.currentTree.warnings = []
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
  }))

}

Installer.prototype.cloneCurrentTreeToIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('install', 'cloneCurrentTreeToIdealTree')
  this.idealTree = clone(this.currentTree)
  this.idealTree.warnings = []
  cb()
}

Installer.prototype.loadShrinkwrap = function (cb) {
  validate('F', arguments)
  log.silly('install', 'loadShrinkwrap')
  var installNewModules = !!this.args.length
  if (installNewModules) {
    readShrinkwrap(this.idealTree, cb)
  } else {
    readShrinkwrap.andInflate(this.idealTree, cb)
  }
}

Installer.prototype.normalizeTree = function (log, cb) {
  validate('OF', arguments)
  log.silly('install', 'normalizeTree')
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
  log.silly('install', 'printInstalled')
  var self = this
  log.clearProgress()
  this.differences.forEach(function (action) {
    var mutation = action[0]
    var child = action[1]
    var name = child.package.name + '@' + child.package.version
    var where = path.relative(self.where, child.path)
    if (mutation === 'remove') {
      console.log('- ' + name + ' ' + where)
    } else if (mutation === 'move') {
      var oldWhere = path.relative(self.where, child.fromPath)
      console.log(name + ' ' + oldWhere + ' -> ' + where)
    }
  })
  var addedOrMoved = this.differences.filter(function (action) {
    var mutation = action[0]
    var child = action[1]
    return !child.failed && (mutation === 'add' || mutation === 'update')
  }).map(function (action) {
    var child = action[1]
    return child.package.name + '@' + child.package.version
  })
  log.showProgress()
  if (!addedOrMoved.length) return cb()
  recalculateMetadata(this.idealTree, log, iferr(cb, function (tree) {
    log.clearProgress()
    ls.fromTree(self.where, tree, addedOrMoved, false, function () {
      log.showProgress()
      cb()
    })
  }))
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
    return aa.package.name.localeCompare(bb.package.name)
  }
  function expandTree (tree) {
    return {
      label: tree.package.name + '@' + tree.package.version,
      nodes: tree.children.sort(byName).map(expandTree)
    }
  }
  return archy(expandTree(tree), '', { unicode: npm.config.get('unicode') })
}
