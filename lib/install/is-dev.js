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

function isThisOptional (node, name) {
  return node.package &&
    node.package.optionalDependencies &&
    node.package.optionalDependencies[name]
}

function andIsDev (name) {
  return function (req) {
    return isThisDev(req, name)
  }
}

function andIsOptional (name) {
  return function (req) {
    return isThisOptional(req, name)
  }
}

exports.isDev = function (node) {
  return node.requiredBy.some(andIsDev(moduleName(node)))
}

exports.isOptional = function (node) {
  return node.requiredBy.some(andIsOptional(moduleName(node)))
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

function andIsOnlyOptional (name) {
  return function (req) {
    var isDev = isThisDev(req, name)
    var isProd = isThisProd(req, name)
    var isOpt = isThisOptional(req, name)

    if (req.isTop) {
      return isOpt && !isDev && !isProd
    } else {
      return isOnlyOptional(req)
    }
  }
}

var isOnlyDev = exports.isOnlyDev = function (node) {
  return node.requiredBy.every(andIsOnlyDev(moduleName(node)))
}

var isOnlyOptional = exports.isOnlyOptional = function (node) {
  return node.requiredBy.every(andIsOnlyOptional(moduleName(node)))
}
