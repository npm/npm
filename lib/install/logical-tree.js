'use strict'
var clone = require('lodash.clonedeep')
var union = require('lodash.union')
var without = require('lodash.without')
var validate = require('aproba')
var flattenTree = require('./flatten-tree.js')

var logicalTree = module.exports = function (tree) {
  validate('O', arguments)
  var logicalTree = clone(tree)
  var flat = flattenTree(logicalTree)
  Object.keys(flat).forEach(function (flatname) {
    var node = flat[flatname]
    if (!node.package || !node.package._requiredBy) return

    var requiredBy = node.package._requiredBy.map(function (parentFlatname) {
      return flat[parentFlatname]
    }).filter(function (parentNode) { return parentNode })

    node.requiredBy = requiredBy

    if (!requiredBy.length) return

    if (node.parent) node.parent.children = without(node.parent.children, node)

    requiredBy.forEach(function (parentNode) {
      parentNode.children = union(parentNode.children, [node])
    })
  })
  return logicalTree
}

module.exports.asReadInstalled = function (tree) {
  return translateTree(logicalTree(tree))
}

function translateTree (tree) {
  var pkg = tree.package || {}
  if (pkg._dependencies) return pkg
  pkg._dependencies = pkg.dependencies
  pkg.dependencies = {}
  tree.children.forEach(function (child) {
    pkg.dependencies[child.package.name] = translateTree(child)
  })
  return pkg
}
