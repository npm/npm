'use strict'
var validate = require('aproba')

module.exports = function (tree) {
  validate('O', arguments)
  var flat = {}
  var todo = [[tree, '/']]
  while (todo.length) {
    var next = todo.shift()
    var pkg = next[0]
    var path = next[1]
    flat[path] = pkg
    if (path !== '/') path += '/'
    for (var ii = 0; ii < pkg.children.length; ++ii) {
      var child = pkg.children[ii]
      todo.push([child, flatName(path, child)])
    }
  }
  return flat
}

var flatName = module.exports.flatName = function (path, child) {
  validate('SO', arguments)
  return path + (child.package.name || 'TOP')
}
