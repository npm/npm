'use strict'
var chain = require('slide').chain
var build = require('../../build.js')
var lifecycle = require('../../utils/lifecycle.js')
var npm = require('../../npm.js')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('build', pkg.package.name)
  chain([
    [build.linkStuff, pkg.package, pkg.path, npm.config.get('global'), false],
    [build.writeBuiltinConf, pkg.package, pkg.path],
    [lifecycle, pkg.package, 'build', buildpath, false, false, next]
  ], next)
}
