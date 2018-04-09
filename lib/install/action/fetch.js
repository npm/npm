'use strict'

const BB = require('bluebird')

const config = require('../../config/figgy-config.js')
const finished = BB.promisify(require('mississippi').finished)
const packageId = require('../../utils/package-id.js')
const pacote = require('pacote')

module.exports = fetch
function fetch (staging, pkg, log, next) {
  log.silly('fetch', packageId(pkg))
  const opts = config({integrity: pkg.package._integrity})
  return finished(pacote.tarball.stream(pkg.package._requested, opts))
    .then(() => next(), next)
}
