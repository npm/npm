'use strict'
// remove a package.

module.exports = uninstall
module.exports.Uninstaller = Uninstaller

uninstall.usage = 'npm uninstall [<@scope>/]<pkg>[@<version>]... [--save|--save-dev|--save-optional]' +
                  '\n\naliases: remove, rm, r, un, unlink'

var util = require('util')
var path = require('path')
var validate = require('aproba')
var chain = require('slide').chain
var npm = require('./npm.js')
var Installer = require('./install.js').Installer
var getSaveType = require('./install/save.js').getSaveType
var removeDeps = require('./install/deps.js').removeDeps
var loadExtraneous = require('./install/deps.js').loadExtraneous
var log = require('npmlog')

uninstall.completion = require('./utils/completion/installed-shallow.js')

function uninstall (args, cb) {
  validate('AF', arguments)
  // the /path/to/node_modules/..
  var where = path.resolve(npm.dir, '..')
  var dryrun = !!npm.config.get('dry-run')

  args = args.filter(function (a) {
    return path.resolve(a) !== where
  })

  if (!args.length) return cb(uninstall.usage)

  new Uninstaller(where, dryrun, args).run(cb)
}

function Uninstaller (where, dryrun, args) {
  validate('SBA', arguments)
  Installer.call(this, where, dryrun, args)
}
util.inherits(Uninstaller, Installer)

Uninstaller.prototype.loadAllDepsIntoIdealTree = function (cb) {
  validate('F', arguments)
  log.silly('uninstall', 'loadAllDepsIntoIdealtree')
  var saveDeps = getSaveType(this.args)

  var cg = this.progress.loadAllDepsIntoIdealTree
  var steps = []

  steps.push(
    [removeDeps, this.args, this.idealTree, saveDeps, cg.newGroup('removeDeps')],
    [loadExtraneous, this.idealTree, cg.newGroup('loadExtraneous')])
  chain(steps, cb)
}

Uninstaller.prototype.normalizeTree = function (log, cb) {
  validate('OF', arguments)
  log.silly('uninstall', 'normalizeTree')
  // If we're looking globally only look at the one package we're operating on
  if (npm.config.get('global')) {
    var args = this.args
    this.currentTree.children = this.currentTree.children.filter(function (child) {
      return args.filter(function (arg) { return arg === child.package.name }).length
    })
  }
  Installer.prototype.normalizeTree.call(this, log, cb)
}
