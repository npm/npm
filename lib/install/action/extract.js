'use strict'

const asyncMap = require('slide').asyncMap
const fs = require('graceful-fs')
const gentlyRm = require('../../utils/gently-rm.js')
const iferr = require('iferr')
const log = require('npmlog')
const mkdirp = require('mkdirp')
const moduleName = require('../../utils/module-name.js')
const moduleStagingPath = require('../module-staging-path.js')
const move = require('../../utils/move.js')
const npm = require('../../npm.js')
const packageId = require('../../utils/package-id.js')
const pacote = require('pacote')
const pacoteOpts = require('../../config/pacote')
const path = require('path')
const readJson = require('read-package-json')
const updatePackageJson = require('../update-package-json')

module.exports = extract
function extract (staging, pkg, log, next) {
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
  pacote.extract(
    pkg.package._requested,
    extractTo,
    opts
  ).then(
    andUpdatePackageJson(pkg, staging, extractTo,
    andStageBundledChildren(pkg, staging, extractTo, log,
    andRemoveExtraneousBundles(extractTo, next))),
  next)
}

function andUpdatePackageJson (pkg, staging, extractTo, next) {
  return iferr(next, function () {
    readJson(path.join(extractTo, 'package.json'), false, function (err, metadata) {
      if (!err) {
        // Copy _ keys (internal to npm) and any missing keys from the possibly incomplete
        // registry metadata over to the full package metadata read off of disk.
        Object.keys(pkg.package).forEach(function (key) {
          if (key[0] === '_' || !(key in metadata)) metadata[key] = pkg.package[key]
        })
        metadata.name = pkg.package.name // things go wrong if these don't match
        // These two sneak in and it's awful
        delete metadata.readme
        delete metadata.readmeFilename
        pkg.package = metadata
      }
      updatePackageJson(pkg, extractTo, next)
    })
  })
}

function andStageBundledChildren (pkg, staging, extractTo, log, next) {
  return iferr(next, () => {
    if (!pkg.package.bundleDependencies) return next()

    asyncMap(pkg.children, andStageBundledModule(pkg, staging, extractTo), next)
  })
}

function andRemoveExtraneousBundles (extractTo, next) {
  return iferr(next, () => {
    gentlyRm(path.join(extractTo, 'node_modules'), next)
  })
}

function andStageBundledModule (bundler, staging, parentPath) {
  return (child, next) => {
    if (child.error) return next(child.error)
    stageBundledModule(bundler, child, staging, parentPath, next)
  }
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

function stageBundledModule (bundler, child, staging, parentPath, next) {
  const stageFrom = path.join(parentPath, 'node_modules', child.package.name)
  const stageTo = moduleStagingPath(staging, child)

  return asyncMap(child.children, andStageBundledModule(bundler, staging, stageFrom), iferr(next, finishModule))

  function finishModule () {
    // If we were the one's who bundled this module…
    if (child.fromBundle === bundler) {
      return moveModule()
    } else {
      return checkForReplacement()
    }
  }

  function moveModule () {
    return mkdirp(path.dirname(stageTo), iferr(next, () => {
      return move(stageFrom, stageTo, iferr(next, updateMovedPackageJson))
    }))
  }

  function checkForReplacement () {
    return fs.stat(stageFrom, function (notExists, exists) {
      const bundlerId = packageId(bundler)
      if (exists) {
        if (!getTree(bundler).warnings.some((w) => {
          return w.code === 'EBUNDLEOVERRIDE'
        })) {
          warn(bundler, 'EBUNDLEOVERRIDE', `${bundlerId} had bundled packages that do not match the required version(s). They have been replaced with non-bundled versions.`)
        }
        log.verbose('bundle', `EBUNDLEOVERRIDE: Replacing ${bundlerId}'s bundled version of ${moduleName(child)} with ${packageId(child)}.`)
        return gentlyRm(stageFrom, next)
      } else {
        return next()
      }
    })
  }

  function updateMovedPackageJson () {
    updatePackageJson(child, stageTo, next)
  }
}
