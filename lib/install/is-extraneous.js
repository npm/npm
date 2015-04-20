'use strict'
var isDev = require('./is-dev.js').isDev

module.exports = function (tree) {
  var pkg = tree.package
  var requiredBy = pkg._requiredBy.filter(function (req) { return req[0] !== '#' })
  var isTopLevel = tree.parent == null
  var isChildOfTop = !isTopLevel && tree.parent.parent == null
  var topHasNoPackageJson = isChildOfTop && tree.parent.package.name === undefined && tree.parent.package.version === undefined && tree.parent.package._id === undefined
  return !isTopLevel && (!isChildOfTop || !topHasNoPackageJson) && requiredBy.length === 0 && !isDev(tree)
}
