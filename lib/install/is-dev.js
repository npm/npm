'use strict'
var isDev = exports.isDev = function (node) {
  return node.package._requiredBy.filter(function (req) { return req === '#DEV:/' }).length
}
exports.isOnlyDev = function (node) {
  return node.package._requiredBy.length === 1 && isDev(node)
}
