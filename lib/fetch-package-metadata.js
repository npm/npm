'use strict'
var fs = require('graceful-fs')
var path = require('path')
var zlib = require('zlib')

var log = require('npmlog')
var realizePackageSpecifier = require('realize-package-specifier')
var tar = require('tar')
var once = require('once')
var semver = require('semver')
var readPackageTree = require('read-package-tree')
var readPackageJson = require('read-package-json')
var iferr = require('iferr')
var rimraf = require('rimraf')
var clone = require('lodash.clonedeep')
var validate = require('aproba')
var unpipe = require('unpipe')
var normalizePackageData = require('normalize-package-data')

var npm = require('./npm.js')
var mapToRegistry = require('./utils/map-to-registry.js')
var cache = require('./cache.js')
var cachedPackageRoot = require('./cache/cached-package-root.js')
var tempFilename = require('./utils/temp-filename.js')
var getCacheStat = require('./cache/get-stat.js')
var unpack = require('./utils/tar.js').unpack
var pulseTillDone = require('./utils/pulse-till-done.js')
var parseJSON = require('./utils/parse-json.js')

function andLogAndFinish (spec, tracker, done) {
  validate('SF', [spec, done])
  return function (er, pkg) {
    if (er) {
      log.silly('fetchPackageMetaData', 'error for ' + spec, er)
      if (tracker) tracker.finish()
    }
    return done(er, pkg)
  }
}

module.exports = function fetchPackageMetadata (spec, where, tracker, done) {
  if (!done) {
    done = tracker || where
    tracker = null
    if (done === where) where = null
  }
  if (typeof spec === 'object') {
    var dep = spec
    spec = dep.raw
  }
  var logAndFinish = andLogAndFinish(spec, tracker, done)
  if (!dep) {
    log.silly('fetchPackageMetaData', spec)
    return realizePackageSpecifier(spec, where, iferr(logAndFinish, function (dep) {
      fetchPackageMetadata(dep, where, tracker, done)
    }))
  }
  if (dep.type === 'version' || dep.type === 'range' || dep.type === 'tag') {
    fetchNamedPackageData(dep, addRequestedAndFinish)
  } else if (dep.type === 'directory') {
    fetchDirectoryPackageData(dep, where, addRequestedAndFinish)
  } else {
    fetchOtherPackageData(spec, dep, where, addRequestedAndFinish)
  }
  function addRequestedAndFinish (er, pkg) {
    if (pkg) annotateMetadata(pkg, dep, spec, where)
    logAndFinish(er, pkg)
  }
}

var annotateMetadata = module.exports.annotateMetadata = function (pkg, requested, spec, where) {
  validate('OOSS', arguments)
  pkg._requested = requested
  pkg._spec = spec
  pkg._where = where
  if (!pkg._args) pkg._args = []
  pkg._args.push([requested, where])
  // non-npm registries can and will return unnormalized data, plus
  // even the npm registry may have package data normalized with older
  // normalization rules. This ensures we get package data in a consistent,
  // stable format.
  try {
    normalizePackageData(pkg)
  } catch (ex) {
    // don't care
  }
}

function fetchOtherPackageData (spec, dep, where, next) {
  validate('SOSF', arguments)
  log.silly('fetchOtherPackageData', spec)
  cache.add(spec, null, where, false, iferr(next, function (pkg) {
    var result = clone(pkg)
    result._inCache = true
    next(null, result)
  }))
}

function fetchDirectoryPackageData (dep, where, next) {
  validate('OSF', arguments)
  log.silly('fetchDirectoryPackageData', dep.name || dep.rawSpec)
  readPackageJson(path.join(dep.spec, 'package.json'), false, next)
}

var regCache = {}

function fetchNamedPackageData (dep, next) {
  validate('OF', arguments)
  log.silly('fetchNamedPackageData', dep.name || dep.rawSpec)
  mapToRegistry(dep.name || dep.rawSpec, npm.config, iferr(next, function (url, auth) {
    if (regCache[url]) {
      pickVersionFromRegistryDocument(clone(regCache[url]))
    } else {
      npm.registry.get(url, {auth: auth}, pulseTillDone('fetchMetadata', iferr(next, pickVersionFromRegistryDocument)))
    }
    function returnAndAddMetadata (pkg) {
      pkg._from = dep.raw
      pkg._resolved = pkg.dist.tarball
      pkg._shasum = pkg.dist.shasum

      next(null, pkg)
    }
    function pickVersionFromRegistryDocument (pkg) {
      if (!regCache[url]) regCache[url] = pkg
      var versions = Object.keys(pkg.versions).sort(semver.rcompare)

      if (dep.type === 'tag') {
        var tagVersion = pkg['dist-tags'][dep.spec]
        if (pkg.versions[tagVersion]) return returnAndAddMetadata(pkg.versions[tagVersion])
      } else {
        var latestVersion = pkg['dist-tags'][npm.config.get('tag')] || versions[0]

        // Find the the most recent version less than or equal
        // to latestVersion that satisfies our spec
        for (var ii = 0; ii < versions.length; ++ii) {
          if (semver.gt(versions[ii], latestVersion)) continue
          if (semver.satisfies(versions[ii], dep.spec)) {
            return returnAndAddMetadata(pkg.versions[versions[ii]])
          }
        }

        // Failing that, try finding the most recent version that matches
        // our spec
        for (var jj = 0; jj < versions.length; ++jj) {
          if (semver.satisfies(versions[jj], dep.spec)) {
            return returnAndAddMetadata(pkg.versions[versions[jj]])
          }
        }

        // Failing THAT, if the range was '*' uses latestVersion
        if (dep.spec === '*') {
          return returnAndAddMetadata(pkg.versions[latestVersion])
        }
      }

      // We didn't manage to find a compatible version
      // If this package was requested from cache, force hitting the network
      if (pkg._cached) {
        log.silly('fetchNamedPackageData', 'No valid target from cache, forcing network')
        return npm.registry.get(url, {
          auth: auth,
          skipCache: true
        }, pulseTillDone('fetchMetadata', iferr(next, pickVersionFromRegistryDocument)))
      }

      // And failing that, we error out
      var targets = versions.length
                  ? 'Valid install targets:\n' + versions.join(', ') + '\n'
                  : 'No valid targets found.'
      var er = new Error('No compatible version found: ' +
                         dep.raw + '\n' + targets)
      return next(er)
    }
  }))
}

function retryWithTarballInCache (pkg, asserter, next) {
  if (!pkg._inCache) {
    cache.add(pkg._spec, null, pkg._where, false, iferr(next, function (newpkg) {
      Object.keys(newpkg).forEach(function (key) {
        if (key[0] !== '_') return
        pkg[key] = newpkg[key]
      })
      pkg._inCache = true
      return asserter(pkg, next)
    }))
  }
  return !pkg._inCache
}

module.exports.addShrinkwrap = function addShrinkwrap (pkg, next) {
  validate('OF', arguments)
  if (pkg._shrinkwrap !== undefined) return next(null, pkg)
  if (retryWithTarballInCache(pkg, addShrinkwrap, next)) return
  // FIXME: cache the shrinkwrap directly
  var tarball = path.join(cachedPackageRoot({name: pkgname, version: ver}), 'package.tgz')
  loadShrinkwrap(tarball, iferr(next, function (shrinkwrap) {
    pkg._shrinkwrap = shrinkwrap || null
    next(null, pkg)
  }))
}

module.exports.addBundled = function addBundled (pkg, next) {
  validate('OF', arguments)
  if (pkg._bundled !== undefined) return next(null, pkg)
  if (!pkg.bundleDependencies) return next(null, pkg)
  if (retryWithTarballInCache(pkg, addBundled, next)) return
  pkg._bundled = null
  var pkgname = pkg.name
  var ver = pkg.version
  var tarball = path.join(cachedPackageRoot({name: pkgname, version: ver}), 'package.tgz')
  var target = tempFilename('unpack')
  getCacheStat(iferr(next, function (cs) {
    log.verbose('addBundled', 'extract', tarball)
    unpack(tarball, target, null, null, cs.uid, cs.gid, iferr(next, function () {
      log.silly('addBundled', 'read tarball')
      readPackageTree(target, function (er, tree) {
        log.silly('cleanup', 'remove extracted module')
        rimraf(target, function () {
          if (tree) {
            pkg._bundled = tree.children
          }
          next(null, pkg)
        })
      })
    }))
  }))
}
