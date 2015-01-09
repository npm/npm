var util = require('util')
var path = require('path')
var validate = require('aproba')
var without = require('lodash.without')
var asyncMap = require('slide').asyncMap
var chain = require('slide').chain
var npm = require('./npm.js')
var Installer = require('./install.js').Installer
var findRequirement = require('./install/deps.js').findRequirement
var earliestInstallable = require('./install/deps.js').earliestInstallable
var decomposeActions = require('./install/decompose-actions.js')
var npa = require('npm-package-arg')
var recalculateMetadata = require('./install/deps.js').recalculateMetadata
var log = require('npmlog')

module.exports = dedupe
module.exports.Deduper = Deduper

dedupe.usage = 'npm dedupe'

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
}
util.inherits(Deduper, Installer)
Deduper.prototype.loadAllDepsIntoIdealTree = function (cb) {
  validate('F', arguments)
  var idealTree = this.idealTree
  var differences = this.differences
  Installer.prototype.loadAllDepsIntoIdealTree.call(this, function (er) {
    if (er) return cb(er)
    hoistChildren(idealTree, differences, cb)
  })
}

Deduper.prototype.generateActionsToTake = function (cb) {
  validate('F', arguments)
  decomposeActions(this.differences, this.todo, this.progress.generateActionsToTake, cb)
}

function hoistChildren (tree, diff, next) {
  validate('OAF', arguments)
  asyncMap(tree.children, function (child, done) {
    if (!tree.parent) return hoistChildren(child, diff, done)
    var better = findRequirement(tree.parent, child.package.name, child.package._requested || npa(child.package.name + '@' + child.package.version))
    if (better) {
      tree.children = without(tree.children, child)
      diff.push(['remove', child])
      return recalculateMetadata(tree, log, done)
    }
    var hoistTo = earliestInstallable(tree, tree.parent, child.package)
    if (hoistTo) {
      tree.children = without(tree.children, child)
      hoistTo.children.push(child)
      child.fromPath = child.path
      child.path = path.resolve(hoistTo.path, 'node_modules', child.package.name)
      child.parent = hoistTo
      diff.push(['move', child])
      chain([
        [recalculateMetadata, hoistTo, log],
        [hoistChildren, child, diff]
      ], done)
    } else {
      done()
    }
  }, next)
}
