'use strict'
var path = require('path')
var chain = require('slide').chain
var build = require('../../build.js')
var npm = require('../../npm.js')
var packageId = require('../../utils/package-id.js')
var getNodeModules = require('../../utils/get-node-modules.js')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('build', packageId(pkg))

  var gnm = npm.config.get('global') && npm.globalDir
  var todo = []

  function note (fn, pkg, path, to, isGlobal, cb) {
    var args = Array.prototype.slice.call(arguments, 1)
    if (to) {
      log.verbose(fn.name, packageId(pkg), 'to', to)
      fn.apply(this, args)
    } else {
      log.verbose(fn.name, packageId(pkg))
      fn.apply(this, args)
    }
  }

  var parent = getNodeModules(pkg.path)
  if (pkg.requiredBy.length) {
    pkg.requiredBy.forEach(function (req) {
      var installTo = path.join(req.path, 'node_modules')
      todo.push(
        [note, build.linkBins, pkg.package, pkg.path, installTo, req.path === gnm])
    })
  } else {
    todo.push(
      [note, build.linkBins, pkg.package, pkg.path, parent, parent === gnm])
  }
  todo.push(
    [note, build.linkMans, pkg.package, pkg.path, parent, parent === gnm],
    [note, build.writeBuiltinConf, pkg.package, pkg.path])
  chain(todo, next)
}
