'use strict'
var url = require('url')

module.exports = function (name, sw, where, cb) {
  var spec = sw.resolved
       ? name + '@' + sw.resolved
       : (sw.from && url.parse(sw.from).protocol)
       ? name + '@' + sw.from
       : name + '@' + sw.version
  process.nextTick(cb, null, spec)
}
