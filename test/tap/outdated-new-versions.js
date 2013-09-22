var test = require("tap").test
var npm = require("../../")

var mr = require("npm-registry-mock")

// config
var port = 1331
var address = "http://localhost:" + port
var pkg = __dirname + '/outdated-new-versions'

test("dicovers new versions in outdated", function (t) {
  process.chdir(pkg)
  t.plan(2)
  mr(port, function (s) {
    npm.load({registry: address}, function () {
      // purge old cached data from previous tests
      npm.commands.cache.clean(["underscore"], function () {
        npm.outdated(function (er, d) {
          for (var i = 0; i < d.length; i++) {
            if (d[i][1] === "underscore")
              t.equal("1.5.1", d[i][4])
            if (d[i][1] === "request")
              t.equal("2.27.0", d[i][4])
          }
          s.close()
          t.end()
        })
      })
    })
  })
})
