'use strict'
var realizePackageSpecifier = require('realize-package-specifier')
var isRegistrySpecifier = require('./is-registry-specifier.js')
var url = require('url')

module.exports = function (name, sw, where, cb) {
  function lookup (ver, cb) {
    realizePackageSpecifier(name + '@' + ver, where, cb)
  }
  if (sw.resolved) {
    return lookup(sw.resolved, cb)
  } else if (sw.from && url.parse(sw.from).protocol) {
    return lookup(sw.from, function (err, spec) {
      if (err || isRegistrySpecifier(spec)) {
        return thenUseVersion()
      } else {
        return cb(null, spec)
      }
    })
  } else {
    return thenUseVersion()
  }
  function thenUseVersion () {
    lookup(sw.version, cb)
  }
}
