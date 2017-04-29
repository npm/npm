'use strict'

const deprCheck = require('./utils/depr-check')
const log = require('npmlog')
const readPackageTree = require('read-package-tree')
const rimraf = require('rimraf')
const validate = require('aproba')
const npa = require('npm-package-arg')
const npm = require('./npm')
const npmlog = require('npmlog')
const limit = require('call-limit')
const tempFilename = require('./utils/temp-filename')
const pacote = require('pacote')
const pacoteOpts = require('./config/pacote')

function andLogAndFinish (spec, tracker, done) {
  validate('SF', [spec, done])
  return (er, pkg) => {
    if (er) {
      log.silly('fetchPackageMetaData', 'error for ' + spec, er)
      if (tracker) tracker.finish()
    }
    return done(er, pkg)
  }
}

const CACHE = require('lru-cache')({
  max: 300 * 1024 * 1024,
  length: (p) => p._contentLength
})

module.exports = limit(fetchPackageMetadata, npm.limit.fetch)
function fetchPackageMetadata (spec, where, opts, done) {
  validate('SSOF|SSFZ|OSOF|OSFZ', [spec, where, opts, done])

  if (!done) {
    done = opts
    opts = {}
  }
  var tracker = opts.tracker
  if (typeof spec === 'object') {
    var dep = spec
    spec = dep.raw
  }
  const logAndFinish = andLogAndFinish(spec, tracker, done)
  pacote.manifest(dep || spec, pacoteOpts({
    annotate: true,
    fullMetadata: opts.fullMetadata,
    log: tracker || npmlog,
    memoize: CACHE,
    where: where
  })).then(
    (pkg) => logAndFinish(null, deprCheck(pkg)),
    logAndFinish
  )
}

module.exports.addBundled = addBundled
function addBundled (pkg, next) {
  validate('OF', arguments)
  if (pkg._bundled !== undefined) return next(null, pkg)
  if (!pkg.bundleDependencies) return next(null, pkg)
  pkg._bundled = null
  const target = tempFilename('unpack')
  const opts = pacoteOpts({integrity: pkg._integrity})
  pacote.extract(pkg._resolved || pkg._requested || npa.resolve(pkg.name, pkg.version), target, opts).then(() => {
    log.silly('addBundled', 'read tarball')
    readPackageTree(target, (err, tree) => {
      if (err) { return next(err) }
      log.silly('cleanup', 'remove extracted module')
      rimraf(target, function () {
        if (tree) {
          pkg._bundled = tree.children
        }
        next(null, pkg)
      })
    })
  }, next)
}
