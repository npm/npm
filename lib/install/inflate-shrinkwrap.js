'use strict'
var asyncMap = require('slide').asyncMap
var path = require('path')
var validate = require('aproba')
var fetchPackageMetadata = require('../fetch-package-metadata.js')
var createChild = require('./node.js').create

var inflateShrinkwrap = module.exports = function (tree, swdeps, finishInflating) {
  validate('OOF', arguments)
  tree.children = []
  asyncMap(Object.keys(swdeps), function (name, next) {
    var sw = swdeps[name]
    var spec = sw.resolved || name + '@' + sw.version
    fetchPackageMetadata(spec, tree.path, function (er, pkg) {
      if (er) return next(er)
      var child = createChild({
        package: pkg,
        loaded: false,
        parent: tree,
        path: path.join(tree.path, 'node_modules', pkg.name),
        realpath: path.resolve(tree.realpath, 'node_modules', pkg.name)
      })
      tree.children.push(child)
      inflateShrinkwrap(child, sw.dependencies || {}, next)
    })
  }, finishInflating)
}
