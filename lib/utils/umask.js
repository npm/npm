// fromString with logging callback

var umask = require("umask")
var npmlog = require("npmlog")
var _fromString = umask.fromString

module.exports = umask

module.exports.fromString = function (val, cb) {
  _fromString(val, function (err, result) {
    if (err) {
      npmlog.warn("invalid umask", err.message)
    }
    val = result
  })

  return val
}