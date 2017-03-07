'use strict'
var fs = require('graceful-fs')
var path = require('path')
var gentlyRm = require('./gently-rm')
var SaveStack = require('./save-stack.js')

module.exports = rename

function rename (from, to, cb) {
  var saved = new SaveStack(rename)

  var basePath = process.cwd()
  var currentPath = path.resolve(basePath, from)
  var targetPath = path.resolve(basePath, to)

  var hadErr = false

  var started = 1 // Unlike ncp we always start with 1 (the top-level rename)
  var finished = 0
  var running = 0
  var limit = 512

  // First, try a 'standard' rename on the top-level directory
  fs.rename(currentPath, targetPath, function (renameErr) {
    if (!renameErr) {
      return cb(null)
    }

    if (renameErr.code !== 'EXDEV' && renameErr.code !== 'EPERM') {
      return cb(saved.completeWith(renameErr))
    }

    getStats(currentPath)
  })

  function startRenameOrCopy (source) {
    if (hadErr) return

    var target = source.replace(currentPath, targetPath)
    started++

    // Always try to rename first
    fs.rename(source, target, function (err) {
      if (!err) {
        return doneOne(true)
      }

      return getStats(source)
    })
  }

  function getStats (source) {
    if (running >= limit) {
      return setImmediate(function () {
        getStats(source)
      })
    }
    running++

    fs.lstat(source, function (err, stats) {
      if (err) return onError(err)
      // We need to get the mode from the stats object and preserve it.
      var item = {
        name: source,
        mode: stats.mode,
        mtime: stats.mtime, // modified time
        atime: stats.atime, // access time
        stats: stats // temporary
      }

      if (stats.isDirectory()) {
        return onDir(item)
      } else if (stats.isFile()) {
        return onFile(item)
      } else if (stats.isSymbolicLink()) {
        // Symlinks don't really need to know about the mode.
        return onLink(source)
      }
    })
  }

  function onFile (file) {
    var target = file.name.replace(currentPath, targetPath)
    copyFile(file, target)
  }

  function copyFile (file, target) {
    var readStream = fs.createReadStream(file.name)
    var writeStream = fs.createWriteStream(target, { mode: file.mode })

    readStream.on('error', onError)
    writeStream.on('error', onError)

    writeStream.on('open', function () {
      readStream.pipe(writeStream)
    })

    writeStream.once('finish', function () {
      setFilePermissions(file, target)
    })
  }

  function setFilePermissions (file, target) {
    fs.chmod(target, file.mode, function (err) {
      if (err) return onError(err)

      fs.open(path, 'r+', function (err, fd) {
        if (err) return onError(err)

        fs.futimes(fd, file.atime, file.mtime, function (futimesErr) {
          fs.close(fd, function (closeErr) {
            if (futimesErr) return onError(futimesErr)
            if (closeErr) return onError(closeErr)
            return doneOne()
          })
        })
      })
    })
  }

  function onDir (dir) {
    var target = dir.name.replace(currentPath, targetPath)
    return mkDir(dir, target)
  }

  function mkDir (dir, target) {
    fs.mkdir(target, dir.mode, function (err) {
      if (err) return onError(err)
      // despite setting mode in fs.mkdir, doesn't seem to work
      // so we set it here.
      fs.chmod(target, dir.mode, function (err) {
        if (err) return onError(err)
        copyDir(dir.name)
      })
    })
  }

  function copyDir (dir) {
    fs.readdir(dir, function (err, items) {
      if (err) return onError(err)
      items.forEach(function (item) {
        startRenameOrCopy(path.join(dir, item))
      })
      return doneOne()
    })
  }

  function onLink (link) {
    var target = link.replace(currentPath, targetPath)
    fs.readlink(link, function (err, resolvedPath) {
      if (err) return onError(err)
      makeLink(resolvedPath, target)
    })
  }

  function makeLink (linkPath, target) {
    fs.symlink(linkPath, target, function (err) {
      if (err) return onError(err)
      return doneOne()
    })
  }

  function onError (err) {
    if (!hadErr) {
      hadErr = true // Only call the callback once
      return cb(saved.finishWith(err))
    }
  }

  function doneOne (skipped) {
    if (!skipped) running--
    finished++

    if ((started === finished) && (running === 0) && (!hadErr)) {
      gentlyRm(currentPath, false, function (err) {
        // xxx: Should this be ignored?
        if (err) onError(err)
        cb(null)
      })
    }
  }
}
