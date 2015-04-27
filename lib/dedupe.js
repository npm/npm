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
var checkPermissions = require('./install/check-permissions.js')
var decomposeActions = require('./install/decompose-actions.js')
var loadExtraneous = require('./install/deps.js').loadExtraneous
var filterInvalidActions = require('./install/filter-invalid-actions.js')
var recalculateMetadata = require('./install/deps.js').recalculateMetadata
var sortActions = require('./install/diff-trees.js').sortActions

module.exports = dedupe
module.exports.Deduper = Deduper

dedupe.usage = 'npm dedupe [package names...]'

function dedupe (args, cb) {
  validate('AF', arguments)
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, '..')
  var dryrun = false
  if (npm.command.match(/^find/)) dryrun = true
  if (npm.config.get('dry-run')) dryrun = true

  new Deduper(where, dryrun).run(cb)
}

function Deduper (where, dryrun) {
  validate('SB', arguments)
  Installer.call(this, where, dryrun, [])
  this.noPackageJsonOk = true
  this.topLevelLifecycles = false
}
util.inherits(Deduper, Installer)

Deduper.prototype.normalizeTree = function (log, cb) {
  validate('OF', arguments)
  log.silly('dedupe', 'normalizeTree')
  // If we're looking globally only look at the one package we're operating on
  if (npm.config.get('global')) {
    var args = this.args
    this.currentTree.children = this.currentTree.children.filter(function (child) {
      return args.filter(function (arg) { return arg === child.package.name }).length
    })
  }
  Installer.prototype.normalizeTree.call(this, log, cb)
}

Deduper.prototype.loadAllDepsIntoIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('dedupe', 'loadAllDepsIntoIdealTree')
  var cg = this.progress.loadAllDepsIntoIdealTree
  loadExtraneous(this.idealTree, cg.newGroup('loadExtraneous'), cb)
}

Deduper.prototype.generateActionsToTake = function (cb) {
  validate('F', arguments)
  log.silly('dedupe', 'generateActionsToTake')
  chain([
    [hoistChildren, this.idealTree, this.differences],
    [this, function (next) {
      this.differences = sortActions(this.differences)
      next()
    }],
    [filterInvalidActions, this.where, this.differences],
    [checkPermissions, this.differences],
    [decomposeActions, this.differences, this.todo]
  ], cb)
}

function move (node, hoistTo, diff) {
  node.parent.children = without(node.parent.children, node)
  hoistTo.children.push(node)
  node.fromPath = node.path
  node.path = path.resolve(hoistTo.path, 'node_modules', node.package.name)
  node.parent = hoistTo
  if (!diff.filter(function (action) { return action[0] === 'move' && action[1] === node }).length) {
    diff.push(['move', node])
  }
}

function moveRemainingChildren (node, diff) {
  node.children.forEach(function (child) {
    move(child, node, diff)
    moveRemainingChildren(child, diff)
  })
}

function remove (child, diff, done) {
  diff.push(['remove', child])
  child.parent.children = without(child.parent.children, child)
  asyncMap(child.children, function (child, next) {
    remove(child, diff, next)
  }, done)
}

function hoistChildren (tree, diff, next) {
  validate('OAF', arguments)
  asyncMap(tree.children, function (child, done) {
    if (!tree.parent) return hoistChildren(child, diff, done)
    var better = findRequirement(tree.parent, child.package.name, child.package._requested || npa(child.package.name + '@' + child.package.version))
    if (better) {
      return chain([
        [remove, child, diff],
        [recalculateMetadata, tree, log]
      ], done)
    }
    var hoistTo = earliestInstallable(tree, tree.parent, child.package)
    if (hoistTo) {
      move(child, hoistTo, diff)
      chain([
        [recalculateMetadata, hoistTo, log],
        [hoistChildren, child, diff],
        [function (next) {
          moveRemainingChildren(child, diff)
          next()
        }]
      ], done)
    } else {
      done()
    }
  }, next)
}
