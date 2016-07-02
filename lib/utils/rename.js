'use strict'
var fs = require('graceful-fs')
var log = require('npmlog')
var path = require('path')
var SaveStack = require('./save-stack.js')

module.exports = rename

function rename (from, to, cb) {
  var saved = new SaveStack(rename)
  fs.rename(from, to, function (renameErr) {
    if (renameErr) {
      try {
        copyDir(from, to)
        rmdir(from)
      } catch (copyErr) {
        log.silly('renameFail', 'Could not copy directory %s => %s: %s',
          from, to, copyErr)
        try {
          rmdir(to)
        } catch (cleanupErr) {
          log.silly('cleanupFailedCopy', 'Could not cleanup partial copy %s: %s',
            to, cleanupErr)
        }
        return cb(saved.completeWith(renameErr))
      }
    }
    return cb()
  })
}

function mkdir (dir) {
  // making directory without exception if exists
  try {
    fs.mkdirSync(dir, '0755')
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e
    }
  }
}

function rmdir (dir) {
  if (fs.existsSync(dir)) {
    var list = fs.readdirSync(dir)
    for (var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i])
      var stat = fs.statSync(filename)

      if (filename === '.' || filename === '..') {
        // pass these files
      } else if (stat.isDirectory()) {
        // rmdir recursively
        rmdir(filename)
      } else {
        // rm fiilename
        fs.unlinkSync(filename)
      }
    }
    fs.rmdirSync(dir)
  } else {
    log.silly('removeDir', 'Does not exist: %s', dir)
  }
}

function copyDir (src, dest) {
  mkdir(dest)
  var files = fs.readdirSync(src)
  for (var i = 0; i < files.length; i++) {
    var current = fs.lstatSync(path.join(src, files[i]))
    if (current.isDirectory()) {
      copyDir(path.join(src, files[i]), path.join(dest, files[i]))
    } else if (current.isSymbolicLink()) {
      var symlink = fs.readlinkSync(path.join(src, files[i]))
      fs.symlinkSync(symlink, path.join(dest, files[i]))
    } else {
      copy(path.join(src, files[i]), path.join(dest, files[i]))
    }
  }
}

function copy (src, dest) {
  var oldFile = fs.createReadStream(src)
  var newFile = fs.createWriteStream(dest)
  oldFile.pipe(newFile)
}
