var test = require("tap").test
var npm = require("../../")

var mr = require("npm-registry-mock")

// config
var port = 1331
var address = "http://localhost:" + port
var pkg = __dirname + '/outdated-new-versions'


test("dicovers new versions in outdated", function (t) {
  process.chdir(pkg)

  mr(port, function (s) {
    npm.load({registry: address}, function () {
      npm.outdated(function (er, d) {
        t.equal("1.5.1", d[0][4]) // dependencies
        t.equal("2.27.0", d[1][4]) // devDependencies
        s.close()
        t.end()
      })
    })
  })
})
