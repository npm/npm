module.exports = upgrade

upgrade.usage = 'npm upgrade'

var npm = require('./npm.js')
var path = require('path')

function upgrade (args, cb) {

  npm.config.set('global', false)
  npm.config.set('prefix', path.resolve(__dirname, '..', '..', '..'))
  if (args.length) return cb(new Error('`npm upgrade` does not take arguments'))

  npm.config.set('depth', 0)
  npm.config.set('tag', 'latest')
  npm.commands.update(['npm'], cb)
}
