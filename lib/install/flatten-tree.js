"use strict"

module.exports = function (tree) {
  var flat = {}
  var todo = [[tree, "/"]]
  while (todo.length) {
    var next = todo.shift()
    var pkg = next[0]
    var path = next[1]
    flat[path] = pkg
    if (path !== "/") path += "/"
    for (var ii = 0; ii < pkg.children.length; ++ii) {
      todo.push([pkg.children[ii], path + pkg.children[ii].package.name])
    }
  }
  return flat
}
