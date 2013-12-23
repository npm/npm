var test = require("tap").test
  , fs = require("fs")
  , path = require("path")
  , existsSync = fs.existsSync || path.existsSync
  , npm = require("../../")
  , rimraf = require("rimraf")

test("installing a package that depends on the current package", function (t) {
  t.plan(1)

  setup(function () {
    npm.install("optimist", function (err) {
      if (err) return t.fail(err)
      npm.dedupe(function(err) {
        if (err) return t.fail(err)
        t.ok(existsSync(path.join(__dirname,
          "circular-dep", "minimist", "node_modules", "optimist",
          "node_modules", "minimist"
        )))
      })
    })
  })
})

function setup (cb) {
  process.chdir(path.join(__dirname, "circular-dep", "minimist"))
  npm.load(function () {
    rimraf.sync(path.join(__dirname,
      "circular-dep", "minimist", "node_modules"))
    fs.mkdirSync(path.join(__dirname,
      "circular-dep", "minimist", "node_modules"))
    cb()
  })
}
