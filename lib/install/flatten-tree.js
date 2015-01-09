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
      var child = pkg.children[ii]
      var name = (child.package.dist && child.package.dist.shasum)
              || child.package._id
              || (child.package.name && child.package.name + "@" + child.package.version)
              || "TOP"
      todo.push([child, path + name])
    }
  }
  return flat
}
