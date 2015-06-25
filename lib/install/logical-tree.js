'use strict'
var clone = require('lodash.clonedeep')
var union = require('lodash.union')
var without = require('lodash.without')
var validate = require('aproba')
var flattenTree = require('./flatten-tree.js')
var isExtraneous = require('./is-extraneous.js')
var validateAllPeerDeps = require('./deps.js').validateAllPeerDeps

var logicalTree = module.exports = function (tree) {
  validate('O', arguments)

  var newTree = clone(tree)

  validateAllPeerDeps(newTree, function (tree, pkgname, version) {
    if (!tree.missingPeers) tree.missingPeers = {}
    tree.missingPeers[pkgname] = version
  })

  var flat = flattenTree(newTree)

  function getNode (flatname) {
    return flatname.substr(0, 5) === '#DEV:' ?
           flat[flatname.substr(5)] :
           flat[flatname]
  }

  Object.keys(flat).sort().forEach(function (flatname) {
    var node = flat[flatname]
    var requiredBy = node.package._requiredBy || []
    var requiredByNames = requiredBy.filter(function (parentFlatname) {
      var parentNode = getNode(parentFlatname)
      if (!parentNode) return false
      return parentNode.package.dependencies[node.package.name] ||
             (parentNode.package.devDependencies && parentNode.package.devDependencies[node.package.name])
    })
    requiredBy = requiredByNames.map(getNode)

    node.requiredBy = requiredBy

    if (!requiredBy.length) return

    if (node.parent) node.parent.children = without(node.parent.children, node)

    requiredBy.forEach(function (parentNode) {
      parentNode.children = union(parentNode.children, [node])
    })
  })
  return newTree
}

module.exports.asReadInstalled = function (tree) {
  return translateTree(logicalTree(tree))
}

function translateTree (tree) {
  var pkg = tree.package
  if (pkg._dependencies) return pkg
  pkg._dependencies = pkg.dependencies
  pkg.dependencies = {}
  tree.children.forEach(function (child) {
    pkg.dependencies[child.package.name] = translateTree(child)
  })
  Object.keys(tree.missingDeps).forEach(function (name) {
    if (pkg.dependencies[name]) {
      pkg.dependencies[name].invalid = true
      pkg.dependencies[name].realName = name
      pkg.dependencies[name].extraneous = false
    } else {
      pkg.dependencies[name] = {
        requiredBy: tree.missingDeps[name],
        missing: true,
        optional: !!pkg.optionalDependencies[name]
      }
    }
  })
  if (tree.missingPeers) {
    Object.keys(tree.missingPeers).forEach(function (pkgname) {
      var version = tree.missingPeers[pkgname]
      pkg.dependencies[pkgname] = {
        _id: pkgname + '@' + version,
        name: pkgname,
        version: version,
        peerMissing: true
      }
    })
  }
  pkg.path = tree.path

  pkg.extraneous = isExtraneous(tree)
  if (tree.target && tree.parent && !tree.parent.target) pkg.link = tree.realpath
  return pkg
}
