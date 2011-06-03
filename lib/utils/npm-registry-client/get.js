
module.exports = get

var GET = require("./request").GET
  , fs = require("../graceful-fs")
  , npm = require("../../../npm")
  , path = require("path")
  , log = require("../log")
  , mkdir = require("../mkdir-p")
  , cacheStat = null

function get (project, version, timeout, nofollow, cb) {
  if (typeof cb !== "function") cb = nofollow, nofollow = false
  if (typeof cb !== "function") cb = timeout, timeout = -1
  if (typeof cb !== "function") cb = version, version = null
  if (typeof cb !== "function") cb = project, project = null
  if (typeof cb !== "function") {
    throw new Error("No callback provided to registry.get")
  }

  if ( process.env.COMP_CWORD !== undefined
    && process.env.COMP_LINE !== undefined
    && process.env.COMP_POINT !== undefined
    ) timeout = Math.max(timeout, 60000)

  var uri = []
  uri.push(project || "")
  if (version) uri.push(version)
  uri = uri.join("/")
  var cache = path.join(npm.cache, uri, ".cache.json")
  fs.stat(cache, function (er, stat) {
    if (!er) fs.readFile(cache, function (er, data) {
      try { data = JSON.parse(data) }
      catch (ex) { data = null }
      get_(uri, timeout, cache, stat, data, nofollow, cb)
    })
    else get_(uri, timeout, cache, null, null, nofollow, cb)
  })
}

function get_ (uri, timeout, cache, stat, data, nofollow, cb) {
  var etag
  if (data && data._etag) etag = data._etag
  if (timeout && timeout > 0 && stat && data) {
    if ((Date.now() - stat.mtime.getTime())/1000 < timeout) {
      log.verbose("not expired, no request", "registry.get " +uri)
      delete data._etag
      return cb(null, data, JSON.stringify(data), {statusCode:304})
    }
  }

  GET(uri, etag, nofollow, function (er, remoteData, raw, response) {
    if (response) {
      log.silly([response.statusCode, response.headers], "get cb")
      if (response.statusCode === 304 && etag) {
        remoteData = data
        log.verbose(uri+" from cache", "etag")
      }
    }

    data = remoteData
    if (er) return cb(er, data, raw, response)

    // just give the write the old college try.  if it fails, whatever.
    function saved () {
      delete data._etag
      cb(er, data, raw, response)
    }

    saveToCache(cache, data, saved)
  })
}

function saveToCache (cache, data, saved) {
  if (cacheStat) {
    return saveToCache_(cache, data, cacheStat.uid, cacheStat.gid, saved)
  }
  fs.stat(npm.cache, function (er, st) {
    if (er) {
      return fs.stat(process.env.HOME || "", function (er, st) {
        // if this fails, oh well.
        if (er) return saved()
        cacheStat = st
        return saveToCache(cache, data, saved)
      })
    }
    cacheStat = st || { uid: null, gid: null }
    return saveToCache(cache, data, saved)
  })
}

function saveToCache_ (cache, data, uid, gid, saved) {
  mkdir(path.dirname(cache), 0755, uid, gid, function (er) {
    if (er) return saved()
    fs.writeFile(cache, JSON.stringify(data), function (er) {
      if (er || uid === null || gid === null) {
        return saved()
      }
      fs.chown(cache, uid, gid, saved)
    })
  })
}
