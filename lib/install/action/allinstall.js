'use strict'
var lifecycle = require('../../utils/lifecycle.js')
var packageId = require('../../utils/package-id.js')
var moduleStagingPath = require('../module-staging-path.js')

module.exports = function (staging, pkg, log, next) {
  log.silly('allinstall', packageId(pkg))
  lifecycle(pkg.package, 'preinstall', pkg.path, andInstall)
  function andInstall () {
    lifecycle(pkg.package, 'install', pkg.path, andPostinstall)
  }
  function andPostInstall () {
    lifecycle(pkg.package, 'postinstall', pkg.path, next)
  }
}
