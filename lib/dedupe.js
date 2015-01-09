var util = require('util')
var path = require('path')
var validate = require('aproba')
var clone = require('lodash.clonedeep')
var without = require('lodash.without')
var chain = require('slide').chain
var npm = require('./npm.js')
var Installer = require('./install.js').Installer
var loadExtraneous = require('./install/deps.js').loadExtraneous
var findRequirement = require('./install/deps.js').findRequirement
var updatePhantomChildren = require('./install/deps.js').updatePhantomChildren
var earliestInstallable = require('./install/deps.js').earliestInstallable
var npa = require('npm-package-arg')

module.exports = dedupe
module.exports.Deduper = Deduper

dedupe.usage = 'npm dedupe'

function dedupe (args,  cb) {
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
  Installer.prototype.loadAllDepsIntoIdealTree.call(this, function (er) {
    if (er) return cb(er)
    hoistChildren(idealTree)
    cb()
  })
}

// FIXME: This isn't perfect, if the child of something we hoisted up is ALSO a duplicate
// then we won't remove it. Multiple dedupes are currently necessary to always fully dedupe.
// This is probably a diff bug/limitation
function hoistChildren (tree) {
  global.debug = true
  tree.children.forEach(function (child) {
    if (tree.parent) {
      var better = findRequirement(tree.parent, child.package.name, child.package._requested || npa(child.package.name + "@" + child.package.version))
      if (better) {
        tree.children = without(tree.children, child)
        updatePhantomChildren(tree, better)
        return
      }
      var hoistTo = earliestInstallable(tree, tree.parent, child.package)
      if (hoistTo) {
        tree.children = without(tree.children, child)
        hoistTo.children.push(child)
        child.path = path.resolve(hoistTo.path, "node_modules", child.package.name)
        updatePhantomChildren(tree, child)
      }
    }
    hoistChildren(child)
  })
}
