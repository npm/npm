'use strict'
module.exports = isOptional

const isOptDep = require('./is-opt-dep.js')

function isOptional (node, seen) {
  if (!seen) seen = {}
  // If a node is not required by anything, then we've reached
  // the top level package.
  if (seen[node.path] || node.requiredBy.length === 0) {
    return false
  }
  seen[node.path] = true

  return node.requiredBy.every(function (req) {
    return isOptDep(req, node.package.name) || isOptional(req, seen)
  })
}
