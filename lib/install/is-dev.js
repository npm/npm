'use strict'
var moduleName = require('../utils/module-name.js')

function isThisDev (node, name) {
  return node.package &&
    node.package.devDependencies &&
    node.package.devDependencies[name]
}

function isThisProd (node, name) {
  return node.package &&
    node.package.dependencies &&
    node.package.dependencies[name]
}

function andIsDev (name) {
  return function (req) {
    return isThisDev(req, name)
  }
}

exports.isDev = function (node) {
  return node.requiredBy.some(andIsDev(moduleName(node)))
}

function andIsOnlyDev (name) {
  return function (req) {
    var isDev = isThisDev(req, name)
    var isProd = isThisProd(req, name)
    if (req.isTop) {
      return isDev && !isProd
    } else {
      return isOnlyDev(req)
    }
  }
}

var isOnlyDev = exports.isOnlyDev = function (node) {
  return node.requiredBy.every(andIsOnlyDev(moduleName(node)))
}
var isTreeDev = exports.isTreeDev = function (node, tree) {
  // If we don't have the node in the tree, assume the node
  // is not a dev dependency (as we're in a subtree)
  //
  // If a node is not required by anything, then we've reached
  // the top level package.
  if (!node || (node && node.requiredBy && node.requiredBy.length === 0)) {
    return false
  }

  // A package is only a devDependency if nothing else requires it
  if (isOnlyDev(node)) {
    return true
  }

  // Otherwise, walk up one step.
  return node.requiredBy.every(function (pkg) {
    return isTreeDev(tree[pkg], tree)
  })
}

var isTreeOptional = exports.isTreeOptional = function (node, tree) {
  // If a node is not required by anything, then we've reached
  // the top level package.
  if (!node || (node && node.requiredBy && node.requiredBy.length === 0)) {
    return false
  }

  return node.requiredBy.every(function (pkg) {
    return pkg && pkg.package.optionalDependencies[node.package.name] || isTreeOptional(pkg, tree)
  })
}
