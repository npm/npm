"use strict"
var clone = require("lodash.clonedeep")
var union = require("lodash.union")
var without = require("lodash.without")
var flattenTree = require("./flatten-tree.js")

module.exports = function (tree) {
  var logicalTree = clone(tree)
  var flat = flattenTree(logicalTree)
  Object.keys(flat).forEach(function (flatname) {
    var node = flat[flatname]
    if (!node.package || !node.package._requiredBy) return

    var requiredBy = node.package._requiredBy.map(function(parentFlatname) {
      return flat[parentFlatname]
    }).filter(function(parentNode) { return parentNode })

    if (!requiredBy.length) return

    node.parent.children = without(node.parent.children, node)

    requiredBy.forEach(function (parentNode) {
      parentNode.children = union(parentNode.children, [node])
    })
  })
  return logicalTree
}