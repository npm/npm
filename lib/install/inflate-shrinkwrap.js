'use strict'
var asyncMap = require('slide').asyncMap
var validate = require('aproba')
var iferr = require('iferr')
var realizeShrinkwrapSpecifier = require('./realize-shrinkwrap-specifier.js')
var fetchPackageMetadata = require('../fetch-package-metadata.js')
var addBundled = require('../fetch-package-metadata.js').addBundled
var inflateBundled = require('./inflate-bundled.js')
var normalizePackageData = require('normalize-package-data')
var npa = require('npm-package-arg')
var npm = require('../npm.js')
var createChild = require('./node.js').create
var moduleName = require('../utils/module-name.js')
var childPath = require('../utils/child-path.js')

module.exports = function (tree, swdeps, finishInflating) {
  if (!npm.config.get('shrinkwrap')) return finishInflating()
  tree.loaded = true
  return inflateShrinkwrap(tree.path, tree, swdeps, finishInflating)
}

function inflateShrinkwrap (topPath, tree, swdeps, finishInflating) {
  validate('SOOF', arguments)
  var onDisk = {}
  tree.children.forEach(function (child) { onDisk[moduleName(child)] = child })
  var dev = npm.config.get('dev') || (!/^prod(uction)?$/.test(npm.config.get('only')) && !npm.config.get('production')) || /^dev(elopment)?$/.test(npm.config.get('only'))
  var prod = !/^dev(elopment)?$/.test(npm.config.get('only'))

  // If the shrinkwrap has no dev dependencies in it then we'll leave the one's
  // already on disk. If it DOES have dev dependencies then ONLY those in the
  // shrinkwrap will be included.
  var swHasDev = Object.keys(swdeps).some(function (name) { return swdeps[name].dev })
  tree.children = swHasDev ? [] : tree.children.filter(function (child) {
    return tree.package.devDependencies[moduleName(child)]
  })

  return asyncMap(Object.keys(swdeps), doRealizeAndInflate, finishInflating)

  function doRealizeAndInflate (name, next) {
    try {
      return inflate(name, realizeShrinkwrapSpecifier(name, swdeps[name], topPath), next)
    } catch (err) {
      return next(err)
    }
  }

  function inflate (name, requested, next) {
    var sw = swdeps[name]
    var dependencies = sw.dependencies || {}
    if ((!prod && !sw.dev) || (!dev && sw.dev)) return next()
    var child = onDisk[name]
    if (childIsEquivalent(sw, requested, child)) {
      if (!child.fromShrinkwrap) child.fromShrinkwrap = requested.raw
      if (sw.dev) child.shrinkwrapDev = true
      tree.children.push(child)
      annotateMetadata(child.package, requested, requested.raw, topPath)
      return inflateShrinkwrap(topPath, child, dependencies || {}, next)
    } else if (sw.version && sw.integrity) {
      var pkg = {
        name: name,
        version: sw.version,
        _from: sw.from,
        _requested: npa.resolve(name, sw.version),
        _optional: sw.optional,
        _integrity: sw.integrity
      }
      child = createChild({
        package: pkg,
        loaded: true,
        parent: tree,
        children: pkg._bundled || [],
        fromShrinkwrap: pkg._requested,
        path: childPath(tree.path, pkg),
        realpath: childPath(tree.realpath, pkg)
      })
      annotateMetadata(child.package, requested, requested.raw, topPath)
      tree.children.push(child)
      inflateShrinkwrap(topPath, child, dependencies || {}, next)
    } else {
      return fetchPackageMetadata(requested, topPath, iferr(next, andAddBundled(dependencies, next)))
    }
  }

  function andAddBundled (dependencies, next) {
    return function (pkg) {
      return addBundled(pkg, iferr(next, andAddChild(pkg, dependencies, next)))
    }
  }

  function andAddChild (pkg, dependencies, next) {
    return function () {
      var child = createChild({
        package: pkg,
        loaded: true,
        parent: tree,
        fromShrinkwrap: pkg._requested,
        path: childPath(tree.path, pkg),
        realpath: childPath(tree.realpath, pkg),
        children: pkg._bundled || []
      })
      tree.children.push(child)
      if (pkg._bundled) {
        delete pkg._bundled
        inflateBundled(child, child, child.children)
      }
      inflateShrinkwrap(topPath, child, dependencies || {}, next)
    }
  }
}

function childIsEquivalent (sw, requested, child) {
  if (!child) return false
  if (child.fromShrinkwrap) return true
  if (sw.resolved) return child.package._resolved === sw.resolved
  if (!requested.registry && sw.from) return child.package._from === sw.from
  return child.package.version === sw.version
}

module.exports.annotateMetadata = annotateMetadata
function annotateMetadata (pkg, requested, spec, where) {
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
