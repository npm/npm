'use strict'
var isDev = exports.isDev = function (node) {
  return node.package._requiredBy.some(function (req) { return req === '#DEV:/' })
}
var isTreeDev = exports.isTreeDev = function (node, tree) {
  // If we don't have the node in the tree, assume the node
  // is not a dev dependency (as we're in a subtree)
  //
  // If a node is not required by anything, then we've reached
  // the top level package.
  if (!node || (node && node.package && node.package._requiredBy.length === 0)) {
    return false
  }

  // A package is only a devDependency if nothing else requires it
  if (node.package._requiredBy.length === 1 && isDev(node)) {
    return true
  }

  // Otherwise, walk up one step.
  return node.package._requiredBy.every(function (pkg) {
    return isTreeDev(tree[pkg], tree)
  })
}
