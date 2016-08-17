'use strict'
var flatNameFromTree = require('./flatten-tree.js').flatNameFromTree

module.exports = reportOptionalFailure

function top (tree) {
  if (tree.parent) return top(tree.parent)
  return tree
}

function reportOptionalFailure (tree, what, error) {
  var topTree = top(tree)
  if (!topTree.warnings) topTree.warnings = []
  error.optional = flatNameFromTree(tree) + (what ? '/' + what : '')
  topTree.warnings.push(error)
}
