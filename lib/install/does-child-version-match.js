'use strict'
module.exports = doesChildVersionMatch

const path = require('path')

const npa = require('npm-package-arg')
const semver = require('semver')

const moduleName = require('../utils/module-name.js')

const registryTypes = { range: true, version: true }

function doesChildVersionMatch (child, requested) {
  // legacy shrinkwraps
  if (child.fromShrinkwrap && !child.hasRequiresFromLock) return true

  // ranges of * ALWAYS count as a match, because when downloading we allow
  // prereleases to match * if there are ONLY prereleases
  if (requested.type === 'range' && requested.fetchSpec === '*') return true

  if (requested.type === 'directory') {
    if (!child.isLink) return false
    return path.relative(child.realpath, requested.fetchSpec) === ''
  }

  if (!registryTypes[requested.type]) {
    const childReq = child.package._requested
    if (childReq) {
      if (childReq.rawSpec === requested.rawSpec) return true
      if (childReq.type === requested.type && childReq.saveSpec === requested.saveSpec) return true
    }
    // If _requested didn't exist OR if it didn't match then we'll try using
    // _from. We pass it through npa to normalize the specifier.
    // This can happen when installing from an `npm-shrinkwrap.json` where `_requested` will
    // be the tarball URL from `resolved` and thus can't match what's in the `package.json`.
    // In those cases _from, will be preserved and we can compare that to ensure that they
    // really came from the same sources.
    // You'll see this scenario happen with at least tags and git dependencies.
    // Some buggy clients will write spaces into the module name part of a _from.
    if (child.package._from) {
      const fromReq = npa.resolve(moduleName(child), child.package._from.replace(new RegExp('^\s*' + moduleName(child) + '\s*@'), ''))
      if (fromReq.rawSpec === requested.rawSpec) return true
      if (fromReq.type === requested.type && fromReq.saveSpec && fromReq.saveSpec === requested.saveSpec) return true
    }
    return false
  }
  try {
    return semver.satisfies(child.package.version, requested.fetchSpec, true)
  } catch (e) {
    return false
  }
}

