"use strict"
var asyncMap = require("slide").asyncMap
var finishLogAfterCb = require("./finish-log-after-cb.js")
var flattenTree = require("./flatten-tree.js")

function pkgAreEquiv(A, B) {
  if (A.dist && B.dist && A.dist.shasum == B.dist.shasum) return true
  if (A.dist || B.dist) return false
  if (A.version == B.version) return true
}

var diffTrees = module.exports = function (oldTree, newTree, actions, log, cb) {
  cb = finishLogAfterCb(log.newItem(log.name), cb)
  oldTree = flattenTree(oldTree)
  newTree = flattenTree(newTree)
  Object.keys(oldTree).forEach(function(path) {
    if (newTree[path]) return
    actions.push(["remove", oldTree[path]])
  })
  Object.keys(newTree).forEach(function(path) {
    if (oldTree[path]) {
      if (pkgAreEquiv(oldTree[path].package, newTree[path].package)) return
      actions.push(["update", newTree[path]])
    }
    else {
      actions.push(["add", newTree[path]])
    }
  })
  cb()
}

