'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('graceful-fs'))
const gentlyRm = BB.promisify(require('../../utils/gently-rm.js'))
const log = require('npmlog')
const mkdirp = BB.promisify(require('mkdirp'))
const moduleName = require('../../utils/module-name.js')
const moduleStagingPath = require('../module-staging-path.js')
const move = BB.promisify(require('../../utils/move.js'))
const npm = require('../../npm.js')
const packageId = require('../../utils/package-id.js')
const pacote = require('pacote')
const pacoteOpts = require('../../config/pacote')
const path = require('path')
const readJson = BB.promisify(require('read-package-json'))

module.exports = extract
function extract (staging, pkg, log) {
  log.silly('extract', packageId(pkg))
  const up = npm.config.get('unsafe-perm')
  const user = up ? null : npm.config.get('user')
  const group = up ? null : npm.config.get('group')
  const extractTo = moduleStagingPath(staging, pkg)
  const opts = pacoteOpts({
    uid: user,
    gid: group,
    integrity: pkg.package._integrity
  })
  return pacote.extract(
    pkg.package._requested,
    extractTo,
    opts
  ).then(() => {
    return readJson(path.join(extractTo, 'package.json'), false).catch(() => {
      return null
    })
  }).then((metadata) => {
    if (metadata) {
      // Copy _ keys (internal to npm) and any missing keys from the possibly incomplete
      // registry metadata over to the full package metadata read off of disk.
      Object.keys(pkg.package).forEach(function (key) {
        metadata[key] = pkg.package[key]
      })
      // These two sneak in and it's awful
      delete metadata.readme
      delete metadata.readmeFilename
      pkg.package = metadata
    }
  }).then(() => {
    if (pkg.package.bundleDependencies) {
      return readBundled(pkg, staging, extractTo)
    }
  }).then(() => {
    return gentlyRm(path.join(extractTo, 'node_modules'))
  })
}

function readBundled (pkg, staging, extractTo) {
  return BB.map(pkg.children, (child) => {
    if (child.error) {
      throw child.error
    } else {
      return stageBundledModule(pkg, child, staging, extractTo)
    }
  }, {concurrency: 10})
}

function getTree (pkg) {
  while (pkg.parent) pkg = pkg.parent
  return pkg
}

function warn (pkg, code, msg) {
  const tree = getTree(pkg)
  const err = new Error(msg)
  err.code = code
  tree.warnings.push(err)
}

function stageBundledModule (bundler, child, staging, parentPath) {
  const stageFrom = path.join(parentPath, 'node_modules', child.package.name)
  const stageTo = moduleStagingPath(staging, child)

  return BB.map(child.children, (child) => {
    if (child.error) {
      throw child.error
    } else {
      return stageBundledModule(bundler, child, staging, stageFrom)
    }
  }).then(() => {
    return finishModule(bundler, child, stageTo, stageFrom)
  })
}

function finishModule (bundler, child, stageTo, stageFrom) {
  // If we were the one's who bundled this module…
  if (child.fromBundle === bundler) {
    return mkdirp(path.dirname(stageTo)).then(() => {
      return move(stageFrom, stageTo)
    })
  } else {
    return fs.statAsync(stageFrom).then(() => {
      const bundlerId = packageId(bundler)
      if (!getTree(bundler).warnings.some((w) => {
        return w.code === 'EBUNDLEOVERRIDE'
      })) {
        warn(bundler, 'EBUNDLEOVERRIDE', `${bundlerId} had bundled packages that do not match the required version(s). They have been replaced with non-bundled versions.`)
      }
      log.verbose('bundle', `EBUNDLEOVERRIDE: Replacing ${bundlerId}'s bundled version of ${moduleName(child)} with ${packageId(child)}.`)
      return gentlyRm(stageFrom)
    }, () => {})
  }
}
