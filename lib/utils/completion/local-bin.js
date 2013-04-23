module.exports = localBin

var npm = require("../../npm.js")
  , find = require("../find.js")
  , path = require("path")

function localBin (filter, cb) {
  var b = npm.bin;
  path.exists(b, function(exists) {
    // Return if there is no local bin dir
    if (!exists) return cb(null, [])
    // Search local bin for files
    find(b, null, 1, function(er, files) {
      return cb(null, (files || []).map(function(f) {
        return f.replace(b + '/', '')
      }))
    })
  })
}
