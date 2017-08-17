var util = require('util')
var path = require('path')
var validate = require('aproba')
var without = require('lodash.without')
var asyncMap = require('slide').asyncMap
var chain = require('slide').chain
var npa = require('npm-package-arg')
var log = require('npmlog')
var npm = require('./npm.js')
var Installer = require('./install.js').Installer
var findRequirement = require('./install/deps.js').findRequirement
var earliestInstallable = require('./install/deps.js').earliestInstallable
var loadExtraneous = require('./install/deps.js').loadExtraneous
var computeMetadata = require('./install/deps.js').computeMetadata
var removeObsoleteDep = require('./install/deps.js').removeObsoleteDep
var moduleName = require('./utils/module-name.js')
var packageId = require('./utils/package-id.js')
var childPath = require('./utils/child-path.js')
var usage = require('./utils/usage')
var getRequested = require('./install/get-requested.js')

module.exports = dedupe
module.exports.Deduper = Deduper

dedupe.usage = usage(
  'dedupe',
  'npm dedupe'
)

function dedupe (args, cb) {
  validate('AF', arguments)
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, '..')
  var dryrun = false
  if (npm.command.match(/^find/)) dryrun = true
  if (npm.config.get('dry-run')) dryrun = true
  if (dryrun && !npm.config.get('json')) npm.config.set('parseable', true)

  new Deduper(where, dryrun).run(cb)
}

function Deduper (where, dryrun) {
  validate('SB', arguments)
  Installer.call(this, where, dryrun, [])
  this.noPackageJsonOk = true
  this.topLevelLifecycles = false
}
util.inherits(Deduper, Installer)

function andComputeMetadata (tree) {
  return function (next) {
    next(null, computeMetadata(tree))
  }
}

Deduper.prototype.loadIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('install', 'loadIdealTree')

  var self = this
  chain([
    [this.newTracker(this.progress.loadIdealTree, 'cloneCurrentTree')],
    [this, this.cloneCurrentTreeToIdealTree],
    [this, this.finishTracker, 'cloneCurrentTree'],

    [this.newTracker(this.progress.loadIdealTree, 'loadIdealTree:loadShrinkwrap')],
    [this, this.loadShrinkwrap],
    [this, this.finishTracker, 'loadIdealTree:loadShrinkwrap'],

    [this.newTracker(this.progress.loadIdealTree, 'loadAllDepsIntoIdealTree', 10)],
    [ function (next) {
      loadExtraneous(self.idealTree, self.progress.loadAllDepsIntoIdealTree, next)
    } ],
    [this, this.finishTracker, 'loadAllDepsIntoIdealTree'],

    [this, andComputeMetadata(this.idealTree)],

    [this.newTracker(log, 'hoist', 1)],
    [this, this.hoistChildren],
    [this, this.finishTracker, 'hoist'],

    [this, andComputeMetadata(this.idealTree)]
  ], cb)
}

function move (node, hoistTo) {
  node.parent.children = without(node.parent.children, node)
  hoistTo.children.push(node)
  node.fromPath = node.path
  node.path = childPath(hoistTo.path, node)
  node.parent = hoistTo
}

function moveRemainingChildren (node) {
  node.children.forEach(function (child) {
    move(child, node)
    moveRemainingChildren(child)
  })
}

function remove (child, done) {
  removeObsoleteDep(child)
  remove_(child, new Set(), done)
}

function remove_ (child, seen, done) {
  if (seen.has(child)) return done()
  seen.add(child)
  child.parent.children = without(child.parent.children, child)
  asyncMap(child.children, function (child, next) {
    remove_(child, seen, next)
  }, done)
}

Deduper.prototype.hoistChildren = function (next) {
  hoistChildren_(this.idealTree, new Set(), next)
}

function withCb (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var cb = args.pop()
    try {
      var result = fn.apply(null, args)
    } catch (ex) {
      return cb(ex)
    }
    return cb(null, result)
  }
}

var globalSeen = new Set()
function hoistChildren_ (tree, seen, next) {
  validate('OOF', arguments)
  if (seen.has(tree)) return next()
  if (globalSeen.has(tree)) {
    log.warn('hostChildren_', tree.path, globalSeen, seen)
    return next()
  }
  globalSeen.add(tree)
  seen.add(tree)
  asyncMap(tree.children, function (child, done) {
    if (!tree.parent) return hoistChildren_(child, seen, done)
    if (child.fromBundle) return done()
    log.silly('hoistChildren', 'hoisting', packageId(child))
    child.removed = true
    var better = findRequirement(tree, moduleName(child), getRequested(child) || npa(packageId(child)))
    child.removed = false
    if (better) {
      return remove(child, done)
    }
    // mark as removed so that we don't force deduping to keep the child
    // where it is
    child.removed = true
    var hoistTo = earliestInstallable(tree, tree, child.package)
    child.removed = false
    if (hoistTo) {
      move(child, hoistTo)
      chain([
        [hoistChildren_, child, seen],
        [withCb(moveRemainingChildren), child]
      ], done)
    } else {
      done()
    }
  }, next)
}
