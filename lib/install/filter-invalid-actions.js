'use strict'
var path = require('path')
var validate = require('aproba')
var log = require('npmlog')

module.exports = function (top, differences, next) {
  validate('SAF', arguments)
  var action
  var keep = []
  while (action = differences.shift()) {
    var cmd = action[0]
    var pkg = action[1]
    if (pkg.isInLink || pkg.parent.target) {
      log.warn('skippingAction', 'Module is inside a symlinked module: not running ' +
        cmd + ' ' + pkg.package._id + ' ' + path.relative(top, pkg.path))
    }
    else {
      keep.push(action)
    }
  }
  differences.push.apply(differences, keep)
  next()
}