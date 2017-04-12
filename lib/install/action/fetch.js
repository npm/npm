'use strict'
// var cache = require('../../cache.js')
// var packageId = require('../../utils/package-id.js')
// var moduleName = require('../../utils/module-name.js')

module.exports = function (staging, pkg, log, next) {
  next()
/*
  if (pkg.package._requested.type === 'directory') return next()
// FIXME: Unnecessary as long as we have to have the tarball to resolve all deps, which
// is progressively seeming to be likely for the indefinite future.
// ALSO fails for local deps specified with relative URLs outside of the top level.

  var name = moduleName(pkg)
  var spec
  var version
  if (pkg.package._requested.registry) {
    version = pkg.package.version
    spec = name + '@' + version
  } else {
    spec = name + '@' + pkg.package._requested.fetchSpec
  }
  log.silly('fetch', packageId(pkg), spec, version)
  cache.add(spec, version, pkg.parent.path, false, next)
*/
}
