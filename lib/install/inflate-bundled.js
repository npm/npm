'use strict'
var path = require('path')
var validate = require('aproba')
var moduleName = require('../utils/module-name.js')

module.exports = function inflateBundled (parent, children) {
  validate('OA', arguments)
  children.forEach(function (child) {
    child.fromBundle = true
    child.parent = parent
    child.path = path.join(parent.path, moduleName(child))
    child.realpath = path.resolve(parent.realpath, moduleName(child))
    child.isLink = child.isLink || parent.isLink || parent.target
    inflateBundled(child, child.children)
  })
}
