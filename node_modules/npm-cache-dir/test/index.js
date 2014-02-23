var cacheDir = require("../")
  , test = require("tap").test
  , mkdirp = require("mkdirp")
  , rimraf = require("rimraf")
  , path = require("path")
  , fs = require("fs")
  , fixtures = path.join(__dirname, "fixtures")

var npm = { cache: path.join(fixtures, "mycache") }
  , log = function () {}

function setup () {
  rimraf.sync(fixtures)
  mkdirp.sync(fixtures)
}

test("getCacheStat creates a directory if not exists", function (t) {
  setup()
  fs.exists(npm.cache, function (e) {
    t.notOk(e, "cache does not exist")
    cacheDir.getCacheStat(npm.cache, log, function () {
      fs.exists(npm.cache, function (e) {
        t.ok(e, "cache exists")
        t.end()
      })
    })
  })
})

test("getCacheStat returns stats", function (t) {
  setup()
  cacheDir.getCacheStat(npm.cache, log, function (err, d) {
    t.ok(d.uid, "uid set")
    t.ok(d.gid, "gid set")
    t.end()
  })
})

test("makeCacheDir creates directories", function (t) {
  setup()
  npm.cache = path.join(fixtures, "npm-test-2")
  fs.exists(npm.cache, function (e) {
    t.notOk(e, "cache does not exist")
    cacheDir.makeCacheDir(npm.cache, log, function () {
      fs.exists(npm.cache, function (e) {
        t.ok(e, "cache exists")
        t.end()
      })
    })
  })
})

test("cleanup", function (t) {
  rimraf.sync(fixtures)
  t.end()
})
