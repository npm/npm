'use strict'
var url = require('url')
var asyncMap = require('slide').asyncMap
var validate = require('aproba')
var iferr = require('iferr')
var realizePackageSpecifier = require('realize-package-specifier')
var fetchPackageMetadata = require('../fetch-package-metadata.js')
var annotateMetadata = require('../fetch-package-metadata.js').annotateMetadata
var addShrinkwrap = require('../fetch-package-metadata.js').addShrinkwrap
var addBundled = require('../fetch-package-metadata.js').addBundled
var inflateBundled = require('./inflate-bundled.js')
var npm = require('../npm.js')
var createChild = require('./node.js').create
var moduleName = require('../utils/module-name.js')
var childPath = require('../utils/child-path.js')

var inflateShrinkwrap = module.exports = function (tree, swdeps, finishInflating) {
  validate('OOF', arguments)
  if (!npm.config.get('shrinkwrap')) return finishInflating()
  var onDisk = {}
  tree.children.forEach(function (child) { onDisk[moduleName(child)] = child })
  tree.children = []
  return asyncMap(Object.keys(swdeps), doRealizeAndInflate, finishInflating)

  function doRealizeAndInflate (name, next) {
    var sw = swdeps[name]
    var spec = sw.resolved
             ? name + '@' + sw.resolved
             : (sw.from && url.parse(sw.from).protocol)
             ? name + '@' + sw.from
             : name + '@' + sw.version
    return realizePackageSpecifier(spec, tree.path, iferr(next, andInflate(name, next)))
  }

  function andInflate (name, next) {
    return function (requested) {
      var sw = swdeps[name]
      var dependencies = sw.dependencies || {}
      var child = onDisk[name]
      if (child && (child.fromShrinkwrap ||
                    (sw.resolved && child.package._resolved === sw.resolved) ||
                    (sw.from && url.parse(sw.from).protocol && child.package._from === sw.from) ||
                    child.package.version === sw.version)) {
        if (!child.fromShrinkwrap) child.fromShrinkwrap = requested.raw
        tree.children.push(child)
        annotateMetadata(child.package, requested, requested.raw, tree.path)
        return inflateShrinkwrap(child, dependencies || {}, next)
      } else {
        var from = sw.from || requested.raw
        return fetchPackageMetadata(requested, tree.path, iferr(next, andAddShrinkwrap(from, dependencies, next)))
      }
    }
  }

  function andAddShrinkwrap (from, dependencies, next) {
    return function (pkg) {
      pkg._from = from
      addShrinkwrap(pkg, iferr(next, andAddBundled(pkg, dependencies, next)))
    }
  }

  function andAddBundled (pkg, dependencies, next) {
    return function () {
      return addBundled(pkg, iferr(next, andAddChild(pkg, dependencies, next)))
    }
  }

  function andAddChild (pkg, dependencies, next) {
    return function () {
      var child = createChild({
        package: pkg,
        loaded: false,
        parent: tree,
        fromShrinkwrap: pkg._from,
        path: childPath(tree.path, pkg),
        realpath: childPath(tree.realpath, pkg),
        children: pkg._bundled || []
      })
      tree.children.push(child)
      if (pkg._bundled) {
        delete pkg._bundled
        inflateBundled(child, child.children)
      }
      inflateShrinkwrap(child, dependencies || {}, next)
    }
  }
}
