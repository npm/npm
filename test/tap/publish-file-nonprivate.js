var fs = require("fs")
var test = require("tap").test
var rimraf = require("rimraf")
var npm = require("../../")

var pkg = __dirname + "/publish-file-nonprivate"

test("it should return an error", function (t) {
  rimraf.sync(pkg + "/node_modules")
  process.chdir(pkg)

  npm.load({cache: pkg + "/cache"}, function () {
    npm.publish(".", function (err) {
      t.ok(err)
      t.equal(err.message, "Publishing modules with git+file:// " +
        "dependencies is not allowed.")
      t.end()
    })
  })
})

test("cleanup", function (t) {
  rimraf.sync(pkg + "/node_modules")
  rimraf.sync(pkg + "/cache")
  t.end()
})
