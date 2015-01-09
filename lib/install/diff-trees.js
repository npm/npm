'use strict'
var validate = require('aproba')
var npa = require('npm-package-arg')
var flattenTree = require('./flatten-tree.js')

function nonRegistrySource (pkg) {
  validate('O', arguments)
  var requested = pkg._requested || (pkg._from && npa(pkg._from))
  if (!requested) return false

  if (requested.type === 'hosted') return true
  if (requested.type === 'local') return true
  return false
}

function pkgAreEquiv (aa, bb) {
  var aaSha = (aa.dist && aa.dist.shasum) || aa._shasum
  var bbSha = (bb.dist && bb.dist.shasum) || bb._shasum
  if (aaSha === bbSha) return true
  if (aaSha || bbSha) return false
  if (nonRegistrySource(aa) || nonRegistrySource(bb)) return false
  if (aa.version === bb.version) return true
  return false
}

function getNameAndVersion (pkg) {
  var versionspec = pkg._shasum

  if (!versionspec && nonRegistrySource(pkg)) {
    if (pkg._requested) {
      versionspec = pkg._requested.spec
    } else if (pkg._from) {
      versionspec = npa(pkg._from).spec
    }
  }
  if (!versionspec) {
    versionspec = pkg.version
  }
  return pkg.name + '@' + versionspec
}

function pushAll (aa, bb) {
  Array.prototype.push.apply(aa, bb)
}

module.exports = function (oldTree, newTree, differences, log, next) {
  validate('OOAOF', arguments)
  pushAll(differences, diffTrees(oldTree, newTree))
  log.finish()
  next()
}

function diffTrees (oldTree, newTree) {
  validate('OO', arguments)
  var differences = []
  var flatOldTree = flattenTree(oldTree)
  var flatNewTree = flattenTree(newTree)
  var toRemove = {}
  var toRemoveByNameAndVer = {}
  // find differences
  Object.keys(flatOldTree).forEach(function (flatname) {
    if (flatNewTree[flatname]) return
    var pkg = flatOldTree[flatname]
    toRemove[flatname] = pkg
    var namever = getNameAndVersion(pkg.package)
    if (!toRemoveByNameAndVer[namever]) toRemoveByNameAndVer[namever] = []
    toRemoveByNameAndVer[namever].push(flatname)
  })
  Object.keys(flatNewTree).forEach(function (path) {
    if (flatNewTree[path].fromBundle) return
    if (flatOldTree[path]) {
      if (!flatNewTree[path].directlyRequested && pkgAreEquiv(flatOldTree[path].package, flatNewTree[path].package)) return
      differences.push(['update', flatNewTree[path]])
    } else {
      var pkg = flatNewTree[path]
      var vername = getNameAndVersion(pkg.package)
      if (toRemoveByNameAndVer[vername] && toRemoveByNameAndVer[vername].length) {
        var flatname = toRemoveByNameAndVer[vername].shift()
        pkg.fromPath = toRemove[flatname].path
        differences.push(['move', pkg])
        delete toRemove[flatname]
      } else {
        differences.push(['add', pkg])
      }
    }
  })
  Object.keys(toRemove).forEach(function (path) {
    differences.push(['remove', toRemove[path]])
  })
  return differences
}
