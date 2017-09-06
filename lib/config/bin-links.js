'use strict'

const npm = require('../npm.js')
var packageId = require('../utils/package-id.js')
const log = require('npmlog')

module.exports = binLinksOpts

function binLinksOpts (pkg) {
  return {
    ignoreScripts: npm.config.get('ignore-scripts'),
    globalBin: npm.globalBin,
    globalDir: npm.globalDir,
    json: npm.config.get('json'),
    log: log,
    parseable: npm.config.get('parseable'),
    pkgId: packageId(pkg),
    prefix: npm.config.get('prefix'),
    umask: npm.config.get('umask')
  }
}
