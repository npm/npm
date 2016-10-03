'use strict'

module.exports = function (tree) {
  return copyTree(tree, {})
}

function copyTree (tree, cache) {
  if (cache[tree.path]) return cache[tree.path]
  var newTree = cache[tree.path] = Object.create(tree)
  copyModuleList(newTree, 'children', cache)
  newTree.children.forEach(function (child) {
    child.parent = newTree
  })
  copyModuleList(newTree, 'requires', cache)
  copyModuleList(newTree, 'requiredBy', cache)
  return newTree
}

function copyModuleList (tree, key, cache) {
  var newList = []
  let list = tree[key]

  if (list) {
    list.forEach(function (child) {
      newList.push(copyTree(child, cache))
    })
  }

  tree[key] = newList
}
