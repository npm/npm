var crypto = require('crypto')
var fs = require('fs')
var path = require('path')
var npm = require('../npm')
var fileCompletion = require('../utils/completion/file-completion.js')

function checksum (str) {
  return crypto
    .createHash('sha1')
    .update(str, 'utf8')
    .digest('hex')
}

function checksumCachedFiles (cb) {
  var valid = true
  fileCompletion(npm.cache, '.', Infinity, function (e, files) {
    if (e) return cb(e)
    files.some(function (f) {
      if (!valid) return true
      var file = path.join(npm.cache, f)
      if (!/.tgz$/.test(file)) return
      var tgz = fs.readFileSync(file)
      try {
        var pkgJSON = fs.readFileSync(path.join(file, '../package/package.json'))
        var shasum = JSON.parse(pkgJSON).dist.shasum
        if (checksum(tgz) !== shasum) valid = false
      } catch (e) {
        valid = false
      }
    })
    cb(null, valid)
  })
}

module.exports = checksumCachedFiles
