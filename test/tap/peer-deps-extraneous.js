var npm = npm = require("../../"),
  test = require("tap").test,
  path = require("path"),
  osenv = require("osenv"),
  rimraf = require("rimraf"),
  mr = require("npm-registry-mock"),
  common = require("../common-tap.js")

var pkg = path.resolve(__dirname, "peer-deps-extraneous")

test("flags request peer-dependency as extraneous", function (t) {
  t.plan(1)

  mr(common.port, function (s) {
    setup(function (err) {
      if (err) return t.fail(err)

      npm.install(".", function (err) {
        if (err) return t.fail(err)

        npm.commands.ls([], true, function (err, _, results) {
          if (err) return t.fail(err)

          t.true(results.dependencies.request.extraneous)
          s.close()
          t.end()
        })
      })
    })
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})

function setup (cb) {
  cleanup()
  process.chdir(pkg)

  var opts = { cache: path.resolve(pkg, "cache"), registry: common.registry};
  npm.load(opts, cb)
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(path.resolve(pkg, "node_modules"))
  rimraf.sync(path.resolve(pkg, "cache"))
}
