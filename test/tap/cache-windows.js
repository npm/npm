var common = require("../common-tap.js")
var test = require("tap").test
var cacheFile = require("npm-cache-filename")
var npm = require("../../")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")
var path = require("path")
var mr = require("npm-registry-mock")
var fs = require("graceful-fs")

var URI      = "https://npm.registry:8043/rewrite"
var TIMEOUT  = 3600
var FOLLOW   = false
var STALE_OK = true
var TOKEN    = "lolbutts"
var AUTH     = {
  token   : TOKEN
}
var PARAMS   = {
  timeout : TIMEOUT,
  follow  : FOLLOW,
  staleOk : STALE_OK,
  auth    : AUTH
}
var PKG_DIR = path.resolve(__dirname, "cache-posix")
var CACHE_DIR = path.resolve(PKG_DIR, "cache")

// mock server reference
var server

var mapper = cacheFile(CACHE_DIR)

function getCachePath (uri) {
  return path.join(mapper(uri), ".cache.json")
}

test("without getuid", function (t) {
  process.getuid = null
  rimraf.sync(CACHE_DIR)

  mr({ port: common.port }, function (s) {
    npm.load({cache: CACHE_DIR, registry: common.registry}, function (err) {
      t.ifError(err)
      server = s

      var versioned = common.registry + "/underscore/1.3.3"
      npm.registry.get(versioned, PARAMS, function (er, data) {
        t.ifError(er, "loaded specified version underscore data")
        t.equal(data.version, "1.3.3")
        fs.stat(getCachePath(versioned), function (er) {
          t.ifError(er, "underscore 1.3.3 cache data written")
          t.end()
        })
      })
    })
  })
})

test("cleanup", function (t) {
  server.close()
  rimraf.sync(PKG_DIR)

  t.end()
})
