'use strict'
var sortedObject = require('sorted-object')

function sortIfPresent (obj, prop) {
  var subobj = obj[prop]
  if (subobj != null && typeof subobj === 'object') {
    obj[prop] = sortedObject(subobj)
  }
}

module.exports = function sortDependencies (obj) {
  if (obj == null || typeof obj !== 'object') return obj
  sortIfPresent(obj, 'dependencies')
  sortIfPresent(obj, 'devDependencies')
  sortIfPresent(obj, 'peerDependencies')
  sortIfPresent(obj, 'bundledDependencies')
  sortIfPresent(obj, 'optionalDependencies')
  return obj
}
