'use strict'

const BB = require('bluebird')

const addBundled = require('../fetch-package-metadata.js').addBundled
const childPath = require('../utils/child-path.js')
const createChild = require('./node.js').create
const fetchPackageMetadata = BB.promisify(require('../fetch-package-metadata.js'))
const inflateBundled = require('./inflate-bundled.js')
const moduleName = require('../utils/module-name.js')
const normalizePackageData = require('normalize-package-data')
const npa = require('npm-package-arg')
const npm = require('../npm.js')
const realizeShrinkwrapSpecifier = require('./realize-shrinkwrap-specifier.js')
const validate = require('aproba')

module.exports = function (tree, swdeps, finishInflating) {
  if (!npm.config.get('shrinkwrap')) return finishInflating()
  tree.loaded = true
  return inflateShrinkwrap(tree.path, tree, swdeps).then(
    () => finishInflating(),
    finishInflating
  )
}

function inflateShrinkwrap (topPath, tree, swdeps) {
  validate('SOO', arguments)
  const onDisk = {}
  tree.children.forEach((child) => {
    onDisk[moduleName(child)] = child
  })
  const dev = npm.config.get('dev') || (!/^prod(uction)?$/.test(npm.config.get('only')) && !npm.config.get('production')) || /^dev(elopment)?$/.test(npm.config.get('only'))
  const prod = !/^dev(elopment)?$/.test(npm.config.get('only'))

  // If the shrinkwrap has no dev dependencies in it then we'll leave the ones
  // already on disk. If it DOES have dev dependencies then ONLY those in the
  // shrinkwrap will be included.
  const swHasDev = Object.keys(swdeps).some((name) => swdeps[name].dev)
  if (swHasDev) {
    tree.children = []
  } else {
    tree.children = tree.children.filter((child) => {
      return tree.package.devDependencies[moduleName(child)]
    })
  }

  return BB.map(Object.keys(swdeps), (name) => {
    const sw = swdeps[name]
    if ((!prod && !sw.dev) || (!dev && sw.dev)) { return null }
    const dependencies = sw.dependencies || {}
    const requested = realizeShrinkwrapSpecifier(name, sw, topPath)
    return inflatableChild(
      onDisk[name], name, topPath, tree, sw, requested
    ).then((child) => {
      return inflateShrinkwrap(topPath, child, dependencies)
    })
  }, {concurrency: 10})
}

function inflatableChild (child, name, topPath, tree, sw, requested) {
  if (childIsEquivalent(sw, requested, child)) {
    // The version on disk matches the shrinkwrap entry.
    if (!child.fromShrinkwrap) child.fromShrinkwrap = requested.raw
    if (sw.dev) child.shrinkwrapDev = true
    tree.children.push(child)
    annotateMetadata(child.package, requested, requested.raw, topPath)
    return BB.resolve(child)
  } else if (sw.version && sw.integrity) {
    // The shrinkwrap entry has an integrity field. We can fake a pkg to get
    // the installer to do a content-address fetch from the cache, if possible.
    const fakeChild = makeFakeChild(name, topPath, tree, sw, requested)
    tree.children.push(fakeChild)
    return BB.resolve(fakeChild)
  } else {
    // It's not on disk, and we can't just look it up by address -- do a full
    // fpm/inflate bundle pass. For registry deps, this will go straight to the
    // tarball URL, as if it were a remote tarball dep.
    return fetchChild(topPath, tree, sw, requested)
  }
}

function makeFakeChild (name, topPath, tree, sw, requested) {
  const pkg = {
    // TODO - this needs information about bundle status to get the Installer
    //        to accept children like this one without replacing bundles.
    name: name,
    version: sw.version,
    _from: sw.from,
    _resolved: sw.resolved,
    _requested: npa.resolve(name, sw.version),
    _optional: sw.optional,
    _integrity: sw.integrity
  }
  const child = createChild({
    package: pkg,
    loaded: true,
    parent: tree,
    children: pkg._bundled || [],
    fromShrinkwrap: pkg._requested,
    path: childPath(tree.path, pkg),
    realpath: childPath(tree.realpath, pkg)
  })
  annotateMetadata(child.package, requested, requested.raw, topPath)
  return child
}

function fetchChild (topPath, tree, sw, requested) {
  const from = sw.from || requested.raw
  const optional = sw.optional
  return fetchPackageMetadata(requested, topPath).then((pkg) => {
    pkg._from = from
    pkg._optional = optional
    return addBundled(pkg).then(() => pkg)
  }).then((pkg) => {
    const child = createChild({
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
    return child
  })
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
