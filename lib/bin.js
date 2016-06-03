module.exports = bin

var npm = require('./npm.js')
var osenv = require('osenv')

bin.usage = 'npm bin [--global]'

function bin (args, silent, cb) {
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }
  var b = npm.bin

  if (!silent) console.log(b)
  process.nextTick(cb.bind(this, null, b))
}

bin.ensureInPath = function ensureInPath (cb) {
  bin(null, true, function checkPath (err, b) {
    if (err) {
      return cb(err)
    }

    if (npm.config.get('global') && osenv.path().indexOf(b) === -1) {
      cb(null, false)
    } else {
      cb(null, true)
    }
  })
}
