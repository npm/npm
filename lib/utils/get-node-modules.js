'use strict'
var path = require('path')
// given a path to a module, returns the node_modules folder that contains it

module.exports = function (dir) {
  var parent = path.dirname(dir)
  if (path.basename(parent)[0] === '@') {
    return path.dirname(parent)
  } else {
    return parent
  }
}
