'use strict'

const duck = require('protoduck')

const Fetcher = duck.define(['spec', 'opts', 'manifest'], {
  manifest: ['spec', 'opts'],
  tarball: ['spec', 'opts'],
  fromManifest: ['manifest', 'spec', 'opts'],
  clearMemoized () {}
}, {name: 'Fetcher'})
module.exports = Fetcher

module.exports.manifest = manifest
function manifest (spec, opts) {
  const fetcher = getFetcher(spec.type)
  return fetcher.manifest(spec, opts)
}

module.exports.tarball = tarball
function tarball (spec, opts) {
  return getFetcher(spec.type).tarball(spec, opts)
}

module.exports.fromManifest = fromManifest
function fromManifest (manifest, spec, opts) {
  return getFetcher(spec.type).fromManifest(manifest, spec, opts)
}

const TYPES = new Set([
  'directory',
  'file',
  'git',
  'hosted',
  'range',
  'remote',
  'tag',
  'version'
])

const fetchers = {}

module.exports.clearMemoized = clearMemoized
function clearMemoized () {
  Object.keys(fetchers).forEach(k => {
    fetchers[k].clearMemoized()
  })
}

function getFetcher (type) {
  if (!TYPES.has(type)) {
    throw new Error(`Invalid dependency type requested: ${type}`)
  } else if (fetchers[type]) {
    return fetchers[type]
  } else {
    const fetcher = (
      fetchers[type] ||
      (
        fetchers[type] = require(`./fetchers/${type}`)
      )
    )
    return fetcher
  }
}
