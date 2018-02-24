'use strict'

const BB = require('bluebird')

const MyPrecious = require('libprecious')
const npm = require('./npm.js')
const npmlog = require('npmlog')
const pacoteOpts = require('./config/pacote.js')
const path = require('path')

const statAsync = BB.promisify(require('fs').stat)

archive.usage = 'npm archive\nnpm archive restore'

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
  BB.resolve(_archive()).nodeify(cb)
}

function _archive (args) {
  // TODO - is this the right path?...
  return statAsync(path.join(npm.prefix, 'archived-packages'))
  .catch((err) => { if (err.code !== 'ENOENT') { throw err } })
  .then((stat) => {
    const archiveExists = stat && stat.isDirectory()
    return new MyPrecious({
      config: npm.config,
      log: npmlog
    })
    .run()
    .then((details) => {
      if (!archiveExists) {
        npmlog.notice('archive', 'created new package archive as `archived-packages/`. Future installations will prioritize packages in this directory.')
      }
      const clauses = []
      if (!details.pkgCount && !details.removed) {
        clauses.push('done')
      }
      if (details.pkgCount) {
        clauses.push(`archived ${details.pkgCount} package${
          details.pkgCount === 1 ? '' : 's'
        }`)
      }
      if (details.removed) {
        clauses.push(`cleaned up ${details.pkgCount} archive${
          details.removed === 1 ? '' : 's'
        }`)
      }
      const time = details.runTime / 1000
      console.error(`${clauses.join(' and ')} in ${time}s`)
    })
  })
}
