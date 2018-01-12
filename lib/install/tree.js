'use strict'

exports.walkRequiredBy = function (tree, each, done) {
  return walkRequiredBy(tree, each, {}, done)
}

function walkRequiredBy (tree, each, seen, done) {
  tree.requiredBy.forEach(function (parent) {
  })
}

exports.walkRequires = function (tree, each, done) {
  return walkRequires(tree, each, {}, done)
}

function walkRequires (tree, each, seen, done) {
  tree.requires.forEach(function (child) {
  })
}
