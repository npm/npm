'use strict'
var moduleName = require('../utils/module-name.js')

function isThisDev (node, name) {
  return node.package &&
    node.package.devDependencies &&
    node.package.devDependencies[name]
}

function isThisProd (node, name) {
  return node.package &&
    node.package.dependencies &&
    node.package.dependencies[name]
}

function andIsDev (name) {
  return function (req) {
    return isThisDev(req, name)
  }
}

exports.isDev = function (node) {
  return node.requiredBy.some(andIsDev(moduleName(node)))
}

function andIsOnlyDev (name) {
  return function (req) {
    var isDev = isThisDev(req, name)
    var isProd = isThisProd(req, name)
    if (req.isTop) {
      return isDev && !isProd
    } else {
      return isOnlyDev(req)
    }
  }
}

var isOnlyDev = exports.isOnlyDev = function (node) {
  return node.requiredBy.every(andIsOnlyDev(moduleName(node)))
}
