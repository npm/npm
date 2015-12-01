'use strict'
module.exports = function loadShrinkwrap (tarball) {
  untarStream(tarball, function (er, untar) {
    if (er) {
      if (er.code === 'ENOTTARBALL') {
        return next()
      } else {
        return next(er)
      }
    }
    if (er) return next(er)
    var foundShrinkwrap = false
    untar.on('entry', function (entry) {
      if (!/^(?:[^\/]+[\/])npm-shrinkwrap.json$/.test(entry.path)) return
      foundShrinkwrap = true
      var shrinkwrap = ''
      entry.on('data', function (chunk) {
        shrinkwrap += chunk
      })
      entry.on('end', function () {
        untar.close()
        try {
          var shrinkwrap = parseJSON(shrinkwrap)
        } catch (ex) {
          var er = new Error('Error parsing ' + tarball + "'s npm-shrinkwrap.json: " + ex.message)
          er.type = 'ESHRINKWRAP'
          return next(er)
        }
        next(null, shrinkwrap)
      })
      entry.resume()
    })
    untar.on('end', function () {
      if (!foundShrinkwrap) {
        next()
      }
    })
  })
}

// FIXME: hasGzipHeader / hasTarHeader / untarStream duplicate a lot
// of code from lib/utils/tar.js– these should be brought together.

function hasGzipHeader (c) {
  return c[0] === 0x1F && c[1] === 0x8B && c[2] === 0x08
}

function hasTarHeader (c) {
  return c[257] === 0x75 && // tar archives have 7573746172 at position
         c[258] === 0x73 && // 257 and 003030 or 202000 at position 262
         c[259] === 0x74 &&
         c[260] === 0x61 &&
         c[261] === 0x72 &&

       ((c[262] === 0x00 &&
         c[263] === 0x30 &&
         c[264] === 0x30) ||

        (c[262] === 0x20 &&
         c[263] === 0x20 &&
         c[264] === 0x00))
}

function untarStream (tarball, cb) {
  validate('SF', arguments)
  cb = once(cb)

  var stream
  var file = stream = fs.createReadStream(tarball)
  var tounpipe = [file]
  file.on('error', function (er) {
    er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
    er.code = 'EREADFILE'
    cb(er)
  })
  file.on('data', function OD (c) {
    if (hasGzipHeader(c)) {
      doGunzip()
    } else if (hasTarHeader(c)) {
      doUntar()
    } else {
      if (file.close) file.close()
      if (file.destroy) file.destroy()
      var er = new Error('Non-gzip/tarball ' + tarball)
      er.code = 'ENOTTARBALL'
      return cb(er)
    }
    file.removeListener('data', OD)
    file.emit('data', c)
    cb(null, stream)
  })

  function doGunzip () {
    var gunzip = stream.pipe(zlib.createGunzip())
    gunzip.on('error', function (er) {
      er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
      er.code = 'EGUNZIP'
      cb(er)
    })
    tounpipe.push(gunzip)
    stream = gunzip
    doUntar()
  }

  function doUntar () {
    var untar = stream.pipe(tar.Parse())
    untar.on('error', function (er) {
      er = new Error('Error extracting ' + tarball + ' archive: ' + er.message)
      er.code = 'EUNTAR'
      cb(er)
    })
    tounpipe.push(untar)
    stream = untar
    addClose()
  }

  function addClose () {
    stream.close = function () {
      tounpipe.forEach(function (stream) {
        unpipe(stream)
      })

      if (file.close) file.close()
      if (file.destroy) file.destroy()
    }
  }
}
