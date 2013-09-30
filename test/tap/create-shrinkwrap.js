var fs = require("fs")
var test = require("tap").test
var rimraf = require("rimraf")
var npm = require("../../")

var mr = require("npm-registry-mock")
// config
var port = 1331
var address = "http://localhost:" + port
var pkg = __dirname + '/create-shrinkwrap'

test("it should not throw", function (t) {
  rimraf.sync(pkg + "/node_modules")
  process.chdir(pkg)

  mr(port, function (s) {
    npm.load({registry: address}, function () {
      npm.install(".", function (err) {
        npm.shrinkwrap(".", function(err) {
          if (err) throw err;
          s.close()
          t.end()
        })
      })
    })
  })
})

test("cleanup", function (t) {
  rimraf.sync(pkg + "/node_modules")
  rimraf.sync(pkg + "/npm-shrinkwrap.json")
  t.end()
})
