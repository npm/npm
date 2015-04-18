'use strict'
var path = require('path')
var fs = require('graceful-fs')
var inflateShrinkwrap = require('./inflate-shrinkwrap.js')

module.exports = function (child, next) {
  fs.readFile(path.join(child.path, 'npm-shrinkwrap.json'), {encoding: 'utf-8'}, function (er, data) {
    if (er) {
      child.package._shrinkwrap = null
      return next()
    }
    try {
      child.package._shrinkwrap = JSON.parse(data)
    } catch (ex) {
      return next(ex)
    }
    if (child.package._shrinkwrap && child.package._shrinkwrap.dependencies) {
      return inflateShrinkwrap(child, child.package._shrinkwrap.dependencies, next)
    } else {
      return next()
    }
  })
}
