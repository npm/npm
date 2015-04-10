'use strict'
var fs = require('fs')
var path = require('path')
var zlib = require('zlib')

var log = require('npmlog')
var realizePackageSpecifier = require('realize-package-specifier')
var tar = require('tar')
var once = require('once')
var semver = require('semver')
var readPackageTree = require('read-package-tree')
var iferr = require('iferr')
var rimraf = require('rimraf')
var clone = require('lodash.clonedeep')
var validate = require('aproba')

var npm = require('./npm.js')
var mapToRegistry = require('./utils/map-to-registry.js')
var cache = require('./cache.js')
var cachedPackageRoot = require('./cache/cached-package-root.js')
var tempFilename = require('./utils/get-name.js').tempFilename
var getCacheStat = require('./cache/get-stat.js')
var unpack = require('./utils/tar.js').unpack
var pulseTillDone = require('./utils/pulse-till-done.js')

function andLogAndFinish (spec, tracker, done) {
  validate('SF', [spec, done])
  return function (er, pkg) {
    validate('EO', arguments)
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
  } else {
    fetchOtherPackageData(spec, dep, where, addRequestedAndFinish)
  }
  function addRequestedAndFinish (er, pkg) {
    validate('EO', arguments)
    if (pkg) {
      pkg._requested = dep
      pkg._spec = spec
      pkg._where = where
      if (!pkg._args) pkg._args = []
      pkg._args.push([pkg._spec, pkg._where])
    }
    logAndFinish(er, pkg)
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
      switch (dep.type) {
      case 'version':
      case 'range':
      case 'tag':
        pkg._from = pkg.name + '@' + dep.spec
        break
      default:
        pkg._from = pkg.spec
      }
      delete pkg._resolved
      delete pkg._shasum
      next(null, pkg)
    }
    function pickVersionFromRegistryDocument (pkg) {
      if (!regCache[url]) regCache[url] = pkg
      var versions = Object.keys(pkg.versions).sort(semver.rcompare)

      if (dep.type === 'tag') {
        var tagVersion = pkg['dist-tags'][dep.spec]
        if (pkg.versions[tagVersion]) return returnAndAddMetadata(pkg.versions[tagVersion])
      } else {
        var latestVersion = pkg['dist-tags'].latest || versions[0]

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
      }

      // And failing that, we error out
      var targets = versions.length
                  ? 'Valid install targets:\n' + JSON.stringify(versions) + '\n'
                  : 'No valid targets found.'
      var er = new Error('No compatible version found: ' +
                         dep.rawSpec + '\n' + targets)
      return next(er)
    }
  }))
}

function retryWithCached (pkg, asserter, next) {
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
  if (retryWithCached(pkg, addShrinkwrap, next)) return
  pkg._shrinkwrap = null
  // FIXME: cache the shrinkwrap directly
  var pkgname = pkg.name
  var ver = pkg.version
  var tarball = path.join(cachedPackageRoot({name: pkgname, version: ver}), 'package.tgz')
  var untar = untarStream(tarball, next)
  var foundShrinkwrap = false
  log.silly('addShrinkwrap', 'Adding shrinkwrap to ' + pkgname)
  untar.on('entry', function (entry) {
    if (!/^(?:[^\/]+[\/])npm-shrinkwrap.json$/.test(entry.path)) return
    log.silly('addShrinkwrap', 'Found shrinkwrap at ' + entry.path)
    foundShrinkwrap = true
    var shrinkwrap = ''
    entry.on('data', function (chunk) {
      shrinkwrap += chunk
    })
    entry.on('end', function () {
      untar.close()
      log.silly('addShrinkwrap', 'Done reading shrinkwrap')
      try {
        pkg._shrinkwrap = JSON.parse(shrinkwrap)
      } catch (ex) {
        var er = new Error('Error parsing ' + pkgname + '@' + ver + "'s npm-shrinkwrap.json: " + ex.message)
        er.type = 'ESHRINKWRAP'
        return next(er)
      }
      next(null, pkg)
    })
    entry.resume()
  })
  untar.on('end', function () {
    if (!foundShrinkwrap) {
      pkg._shrinkwrap = null
      next(null, pkg)
    }
  })
}

module.exports.addBundled = function addBundled (pkg, next) {
  validate('OF', arguments)
  if (pkg._bundled !== undefined) return next(null, pkg)
  if (!pkg.bundleDependencies) return next(null, pkg)
  if (retryWithCached(pkg, addBundled, next)) return
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

function untarStream (tarball, cb) {
  validate('SF', arguments)
  cb = once(cb)
  var file = fs.createReadStream(tarball)
  file.on('error', function (er) {
    er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
    er.code = 'EREADFILE'
    cb(er)
  })
  var gunzip = file.pipe(zlib.createGunzip())
  gunzip.on('error', function (er) {
    er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
    er.code = 'EGUNZIP'
    cb(er)
  })
  var untar = gunzip.pipe(tar.Parse())
  untar.on('error', function (er) {
    er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
    er.code = 'EUNTAR'
    cb(er)
  })
  untar.close = function () {
    gunzip.unpipe(untar)
    file.unpipe(gunzip)
    file.close()
  }
  return untar
}
