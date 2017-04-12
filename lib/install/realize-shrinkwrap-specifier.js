'use strict'
var npa = require('npm-package-arg')

module.exports = function (name, sw, where) {
  if (sw.resolved) {
    return npa.resolve(name, sw.resolved, where)
  } else if (sw.from) {
    try {
      var spec = npa.resolve(name, sw.from, where)
      if (!spec.registry) return spec
    } catch (_) { }
  }
  return npa.resolve(name, sw.version, where)
}
