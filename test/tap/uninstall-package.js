var test = require("tap").test
  , npm = require("../../")

test("returns a list of removed items", function (t) {
  t.plan(1)

  setup(function () {
    npm.install(".", function (err) {
      if (err) return t.fail(err)
      npm.uninstall("tap", "ini", "lala", function (err, d) {
        if (err) return t.fail(err)
        t.same(d, ["tap", "ini"])
        t.end()
      })
    })
  })
})

function setup (cb) {
  process.chdir(__dirname + "/uninstall-package")
  npm.load(function () {
    cb()
  })
}