'use strict'
var fs = require('graceful-fs')
var path = require('path')
var rimraf = require('rimraf')
var SaveStack = require('./save-stack.js')

module.exports = rename

/**
 * Rename or move a single directory.
 */
function rename (src, dest, cb) {
  var saved = new SaveStack(rename)
  try {
    renameOrCopy(src, dest)
    try {
      removeFile(src)
    } catch (_) {
      // XXX: Cleanup failures don't throw exception
    }
  } catch (renameErr) {
    return cb(saved.completeWith(renameErr))
  }
  return cb()
}

function removeFile (filename) {
  var exists = false
  try {
    fs.accessSync(filename)
    exists = true
  } catch (_) {}

  if (exists) {
    rimraf.sync(filename)
  }
}

function copyDir (src, dest) {
  var filenames = fs.readdirSync(src)
  fs.mkdirSync(dest)

  for (var i = 0; i < filenames.length; i++) {
    renameOrCopy(path.join(src, filenames[i]), path.join(dest, filenames[i]))
  }
}

function copyFile (src, dest) {
  var oldFile = fs.createReadStream(src)
  var newFile = fs.createWriteStream(dest)
  oldFile.pipe(newFile)
}

function copyLink (src, dest) {
  var symlink = fs.readlinkSync(src)
  fs.symlinkSync(symlink, dest)
}

function syncPermissions (srcStats, dest) {
  var destFD = fs.openSync(dest, 'r+')

  fs.fchownSync(destFD, srcStats.uid, srcStats.gid)
  fs.fchmodSync(destFD, srcStats.mode)
  fs.futimesSync(destFD, srcStats.atime, srcStats.mtime)

  fs.closeSync(destFD)
}

function renameOrCopy (src, dest) {
  try {
    fs.renameSync(src, dest)
  } catch (renameErr) {
    var srcStats
    try {
      removeFile(dest)
      srcStats = fs.lstatSync(src)
    } catch (_) {
      throw renameErr
    }

    if (srcStats.isDirectory()) {
      copyDir(src, dest)
    } else if (srcStats.isSymbolicLink()) {
      copyLink(src, dest)
    } else {
      copyFile(src, dest)
    }
    syncPermissions(srcStats, dest)
  }
}
