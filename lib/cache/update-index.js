module.exports = updateIndex

var fs = require('graceful-fs')
var assert = require('assert')
var path = require('path')
var mkdir = require('mkdirp')
var chownr = require('chownr')
var npm = require('../npm.js')
var log = require('npmlog')
var cacheFile = require('npm-cache-filename')
var getCacheStat = require('./get-stat.js')
var mapToRegistry = require('../utils/map-to-registry.js')
var pulseTillDone = require('../utils/pulse-till-done.js')
var jsonstream = require('JSONStream')
var asyncMap = require('slide').asyncMap
var writeStreamAtomic = require('fs-write-stream-atomic')
var once = require('once')

/* /-/all is special.
 * It uses timestamp-based caching and partial updates,
 * because it is a monster.
 */
function updateIndex (staleness, args, notArgs, filter, cb) {
  assert(typeof filter === 'function', 'must pass filter callback to updateIndex')
  assert(typeof cb === 'function', 'must pass final callback to updateIndex')

  mapToRegistry('-/all', npm.config, function (er, uri, auth) {
    if (er) return cb(er)

    var params = {
      timeout: staleness,
      follow: true,
      staleOk: true,
      auth: auth,
      streaming: true
    }
    var cacheBase = path.join(cacheFile(npm.config.get('cache'))(uri), '_search')
    log.info('updateIndex', cacheBase)

    getCacheStat(function (er, st) {
      if (er) return cb(er)

      mkdir(cacheBase, function (er, made) {
        if (er) return cb(er)

        chownr(made || cacheBase, st.uid, st.gid, function (er) {
          if (er) return cb(er)

          fs.readdir(cacheBase, function (er, cacheFiles) {
            if (er) return cb(er)

            cacheFiles.sort()

            var latest = 0
            asyncMap(cacheFiles, function (file, cb) {
              log.silly('search', 'reading cache ' + file)
              cb = once(cb)
              var m = /^(\d+)-(\d+)[.]json/.exec(file)
              if (m) {
                latest = Number(m[2])
                var cacheFile = path.join(cacheBase, file)

                fs.stat(cacheFile, function (er, stat) {
                  if (er) return cb(er)
                  var r = fs.createReadStream(cacheFile).pipe(log.newStream('readCache', stat.size))
                  var f = r.pipe(collectResults(filter, args, notArgs, cb))
                  f.once('error', cb)
                })
              } else {
                cb(null, {})
              }
            }, function (err, data) {
              if (err) return cb(err)

              data = data.reduce(function (a, e) {
                Object.keys(e).forEach(function (k) {
                  a[k] = e[k]
                })
                return a
              }, {})

              // use the cache and make no request if it's not too old
              if (Date.now() - latest < 60000) {
                finish(data, cb)
              } else {
                if (latest === 0) {
                  log.warn('', 'Building the local index for the first time, please be patient')
                } else {
                  log.verbose('updateIndex', 'Cached search data present with timestamp', latest)
                  uri += '/since?stale=update_after&startkey=' + latest
                }

                updateIndex_(uri, params, latest, filter, args, notArgs, cacheBase, function (err, updated) {
                  if (err) return cb(err)

                  Object.keys(updated).forEach(function (k) {
                    data[k] = updated[k]
                  })

                  finish(data, cb)
                })
              }
            })
          })
        })
      })
    })
  })
}

function finish (data, cb) {
  var keys = Object.keys(data)
  keys.sort()
  var results = keys.map(function (k) {
    return data[k]
  })

  cb(null, results)
}

function updateIndex_ (all, params, latest, filter, args, notArgs, cacheBase, cb) {
  cb = once(cb)
  log.silly('update-index', 'fetching', all)
  npm.registry.request(all, params, pulseTillDone('updateIndex', function (er, res) {
    if (er) return cb(er)

    var results = null
    var updated = null
    var wroteUpdate = false

    var trackerStream = log.newStream('updateIndex')

    var tmpName = path.join(cacheBase, latest + '-next.json')
    var writeStream = writeStreamAtomic(tmpName)
    res.setMaxListeners(20) // node 0.8 has a lower margin
    res.pipe(writeStream)
    res.pipe(trackerStream)
    writeStream.once('error', cb)
    writeStream.once('close', function () {
      wroteUpdate = true
      maybeFinishUpdateIndex()
    })

    res.pipe(collectResults(filter, args, notArgs, function (err, results_, updated_) {
      if (err) return cb(err)
      results = results_
      updated = updated_
      maybeFinishUpdateIndex()
    }))

    function maybeFinishUpdateIndex () {
      if (results && wroteUpdate) {
        var finalName = path.join(cacheBase, latest + '-' + updated + '.json')
        log.silly('update-index', 'moving final cache file into place', finalName)
        fs.rename(tmpName, finalName, function (err) {
          if (err) return cb(err)
          cb(null, results)
        })
      }
    }
  }))
}

function collectResults (filter, args, notArgs, cb) {
  cb = once(cb)

  var results = {}
  var updated = null
  var stream = jsonstream.parse('*', function (pkg, key) {
    if (key[0] === '_updated') {
      updated = pkg
      return
    }
    if (key[0][0] !== '_') {
      if (filter(pkg, args, notArgs)) {
        log.verbose('search', 'matched ' + pkg.name)
        results[pkg.name] = pkg
      } else {
        log.silly('search', 'not matched ' + pkg.name)
      }
    } else {
      log.silly('search', 'skipping ' + key)
    }
  })

  stream.once('error', cb)

  stream.once('end', function () {
    cb(null, results, updated)
  })

  return stream
}
