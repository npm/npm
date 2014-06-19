var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")

var mr = require("npm-registry-mock")

var pkg = __dirname + "/outdated-with-depth"
mkdirp.sync(pkg + "/cache")

var expected = [ pkg + '/node_modules/request'
               , 'underscore'
               , '1.1.0'
               , '1.3.3'
               , '1.5.1'
               , '~1.3.1'
               ]

test("depth option should work for outdated", function (t) {
  process.chdir(pkg)
  t.plan(3)

  mr(common.port, function (s) {

    npm.load({
      cache: pkg + "/cache",
      registry: common.registry,
      loglevel: 'silent',
      depth: 0 }
    , function () {
      npm.outdated(function (er, d) {
        t.equal(d.length, 0)
        next()
      })
    })

    function next () {
      npm.config.set("depth", 1)
      npm.outdated(function (er, d) {
        t.equal(d.length, 1)
        t.deepEqual(d[0], expected)
        s.close()
        t.end()
      })
    }
  })
})

test("cleanup", function (t) {
  rimraf.sync(pkg + "/cache")
  t.end()
})