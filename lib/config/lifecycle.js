'use strict'

const npm = require('../npm.js')

module.exports = lifecycleOpts

function lifecycleOpts () {
  return {
    config: npm.config.snapshot,
    dir: npm.dir,
    force: npm.config.get('force'),
    group: npm.config.get('group'),
    ignorePrepublish: npm.config.get('ignore-prepublish'),
    ignoreScripts: npm.config.get('ignore-scripts'),
    production: npm.config.get('production'),
    scriptShell: npm.config.get('script-shell'),
    scriptsPrependNodePath: npm.config.get('scripts-prepend-node-path'),
    unsafePerm: npm.config.get('unsafe-perm'),
    user: npm.config.get('user')
  }
}
