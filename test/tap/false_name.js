// this is a test for fix #2538

// the false_name-test-package has the name property "test-package" set
// in the package.json and a dependency named "test-package" is also a
// defined dependency of "test-package-with-one-dep".
//
// this leads to a conflict during installation and the fix is covered
// by this test

var test = require("tap").test
  , fs = require("fs")
  , path = require("path")
  , existsSync = fs.existsSync || path.existsSync
  , npm = require("../../")
  , rimraf = require("rimraf")
  , common = require("../common-tap.js")
  , mr = require("npm-registry-mock")
  , pkg = path.resolve(__dirname, "false_name")
  , cache = path.resolve(pkg, "cache")
  , nodeModules = path.resolve(pkg, "node_modules")

test("not every pkg.name can be required", function (t) {
  rimraf.sync(pkg + "/cache")

  t.plan(1)
  mr(common.port, function (s) {
    setup(function () {
      npm.install(".", function (err) {
        if (err) return t.fail(err)
        s.close()
        t.ok(existsSync(pkg + "/node_modules/test-package-with-one-dep/" +
          "node_modules/test-package"))
      })
    })
  })
})

test("cleanup", function (t) {
  rimraf.sync(cache)
  rimraf.sync(nodeModules)
  t.end()
})

function setup (cb) {
  process.chdir(pkg)
  npm.load({cache: cache, registry: common.registry},
    function () {
      rimraf.sync(nodeModules)
      fs.mkdirSync(nodeModules)
      cb()
    })
}
