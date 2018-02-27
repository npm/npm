'use strict'
const Bluebird = require('bluebird')
const rimraf = Bluebird.promisify(require('rimraf'))
const packageId = require('../../utils/package-id.js')

module.exports = function (staging, pkg, log) {
  log.silly('remove-asset-index', packageId(pkg))
  return rimraf(pkg.path + '.js')
}
