'use strict'
var npm = require('../../npm.js')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('global-install', pkg.package.name)
  var oldGlobal = npm.config.get('global')
  npm.config.set('global', true)
  npm.install(pkg.package._resolved, function () {
    npm.config.set('global', oldGlobal)
    next.apply(null, arguments)
  })
}
