var fs = require('fs')
var path = require('path')
var fileCompletion = require('../utils/completion/file-completion.js')
var getUid = require('uid-number')
var npm = require('../npm.js')

function checkFilesPermission (root, mask, cb) {
  var accessible = true
  if (process.platform === 'win32') return cb(null, !accessible)
  fileCompletion(root, '.', Infinity, function (e, files) {
    if (e) return cb(e)
    files.some(function (f) {
      if (!accessible) return true
      var file = path.join(root, f)
      fs.stat(file, function (e, stat) {
        if (e) return cb(e)
        if (!stat) {
          accessible = false
          return
        }
        if (!stat.isFile()) return
        var mode = stat.mode
        getUid(npm.config.get('user'), npm.config.get('group'), function (e, uid, gid) {
          if (e) return cb(e)
          var isGroup = stat.gid ? stat.gid === gid : true
          var isUser = stat.uid ? stat.uid === uid : true
          if ((mode & parseInt('000' + mask, 8))) return
          if ((isGroup && mode & parseInt('00' + mask + '0', 8))) return
          if ((isUser && mode & parseInt('0' + mask + '00', 8))) return
          accessible = false
        })
      })
    })
    cb(null, accessible)
  })
}

module.exports = checkFilesPermission
