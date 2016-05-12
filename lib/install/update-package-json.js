'use strict'
var path = require('path')
var writeFileAtomic = require('write-file-atomic')
var deepSortObject = require('../utils/deep-sort-object.js')

module.exports = function (pkg, buildpath, next) {
  var packagejson = deepSortObject(pkg.package)
  var data = JSON.stringify(packagejson, null, 2) + '\n'
  writeFileAtomic(path.resolve(buildpath, 'package.json'), data, next)
}
