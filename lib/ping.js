var npm = require('./npm.js')

module.exports = ping

ping.usage = 'npm ping\nping registry'

function ping (args, silent, cb) {
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }
  var registry = npm.config.get('registry')
  if (!registry) return cb(new Error('no default registry set'))

  npm.registry.ping(registry, function (er, pong) {
    cb(er, er ? null : pong)
  })
}
