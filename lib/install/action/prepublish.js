'use strict'
var chain = require('slide').chain
var lifecycle = require('../../utils/lifecycle.js')
var packageId = require('../../utils/package-id.js')

module.exports = function (top, buildpath, pkg, log, next) {
  log.silly('prepublish', packageId(pkg), buildpath)
  chain(
    [
      [lifecycle, pkg.package, 'prepublish', buildpath, false, false],
      [lifecycle, pkg.package, 'prepare', buildpath, false, false]
    ],
    next
  )
}
