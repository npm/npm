"use strict"

module.exports = function (parent, cb) {
  return function (er) {
    if (!er) return cb.apply(null, arguments)
    if (parent && parent.package && parent.package.name) {
      er.parent = parent.package.name
    }
    cb(er)
  }
}
