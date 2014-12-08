"use strict"
module.exports = function (tree) {
  var flat = {}
  var F = function (tree, path) {
    path += tree.package.name
    flat[path] = tree
    tree.children.forEach(function(C) { F(C, path + "/") })
  }
  F(tree, "")
  return flat
}
