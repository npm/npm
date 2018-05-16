'use strict'

const BB = require('bluebird')

const MyPrecious = require('libprecious')
const npm = require('./npm.js')
const npmlog = require('npmlog')
const pacoteOpts = require('./config/pacote.js')

archive.usage = 'npm unarchive'

archive.completion = (cb) => cb(null, [])

MyPrecious.PreciousConfig.impl(npm.config, {
  get: npm.config.get,
  set: npm.config.set,
  toPacote (moreOpts) {
    return pacoteOpts(moreOpts)
  }
})

module.exports = archive
function archive (args, cb) {
  BB.resolve(_unarchive()).nodeify(cb)
}

function _unarchive () {
  return new MyPrecious({
    config: npm.config,
    log: npmlog
  })
  .unarchive()
  .then(() => console.error('archive information and tarballs removed'))
}
