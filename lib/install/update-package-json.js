'use strict'
var path = require('path')
var writeFileAtomic = require('write-file-atomic')
var sortedObject = require('sorted-object')

var deepSortObject = function (obj, sortBy) {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Array) {
    return obj.sort(sortBy)
  }
  obj = sortedObject(obj)
  Object.keys(obj).forEach(function (key) {
    obj[key] = deepSortObject(obj[key])
  })
  return obj
}

module.exports = function (pkg, buildpath, next) {
  // FIXME: This bundled dance is because we're sticking a big tree of bundled
  // deps into the parsed package.json– it probably doesn't belong there =/
  // But the real reason we don't just dump it out is that it's the result
  // of npm-read-tree, which produces circular data structures, due to the
  // parent and children keys.
  var bundled = pkg.package._bundled
  delete pkg.package._bundled // FIXME
  var packagejson = deepSortObject(pkg.package)
  var data = JSON.stringify(packagejson, null, 2) + '\n'
  pkg.package._bundled = bundled
  writeFileAtomic(path.resolve(buildpath, 'package.json'), data, next)
}
