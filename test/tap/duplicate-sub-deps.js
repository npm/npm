var test = require("tap").test
  , fs = require("fs")
  , path = require("path")
  , existsSync = fs.existsSync || path.existsSync
  , npm = require("../../")
  , rimraf = require("rimraf")

test("duplicate-sub-deps flag install all dependencies even if they are already installed on higher levels", function (t) {
  t.plan(1)

  setup(function () {
    npm.config.set("duplicate-sub-deps", true)
    npm.install(".", function (err) {
      if (err) return t.fail(err)
      t.ok(existsSync(path.join(__dirname, "duplicate-sub-deps", "node_modules", "nconf", "node_modules", "async")))
    })
  })
})

test('cleanup', function (t) {
  rimraf.sync(path.join(__dirname, "duplicate-sub-deps", "node_modules"))
  t.end()
})

function setup (cb) {
  process.chdir(path.join(__dirname, "duplicate-sub-deps"))
  npm.load(function () {
    rimraf.sync(path.join(__dirname, "duplicate-sub-deps", "node_modules"))
    cb()
  })
}
