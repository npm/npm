"use strict"
var flattenTree = require("./flatten-tree.js")

function pkgAreEquiv (aa, bb) {
  var aaSha = (aa.dist && aa.dist.shasum) || aa._shasum
  var bbSha = (bb.dist && bb.dist.shasum) || bb._shasum
  if (aaSha === bbSha) return true
  if (aaSha || bbSha) return false
  if (aa.version === bb.version) return true
  return false
}

module.exports = function (oldTree, newTree, differences, log, next) {
  var flatOldTree = flattenTree(oldTree)
  var flatNewTree = flattenTree(newTree)
  Object.keys(flatOldTree).forEach(function (path) {
    if (flatNewTree[path]) return
    differences.push(["remove", flatOldTree[path]])
  })
  Object.keys(flatNewTree).forEach(function (path) {
    if (flatNewTree[path].fromBundle) return
    if (flatOldTree[path]) {
      if (!flatNewTree[path].directlyRequested && pkgAreEquiv(flatOldTree[path].package, flatNewTree[path].package)) return
      differences.push(["update", flatNewTree[path]])
    }
    else {
      differences.push(["add", flatNewTree[path]])
    }
  })
  log.finish()
  next()
}
