var common = require("../common-tap")
  , test = require("tap").test
  , path = require("path")
  , rimraf = require("rimraf")
  , osenv = require("osenv")
  , mkdirp = require("mkdirp")
  , pkg = path.resolve(__dirname, "ls-depth")
  , mr = require("npm-registry-mock")
  , opts = {cwd: pkg}


function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg + "/cache")
  rimraf.sync(pkg + "/tmp")
  rimraf.sync(pkg + "/node_modules")
}

test("setup", function (t) {
  cleanup()
  mkdirp.sync(pkg + "/cache")
  mkdirp.sync(pkg + "/tmp")
  mr({port : common.port}, function (er, s) {
    var cmd = ["install", "--registry=" + common.registry]
    common.npm(cmd, opts, function (er, c) {
      if (er) throw er
      t.equal(c, 0)
      s.close()
      t.end()
    })
  })
})

test("npm ls --dev", function (t) {
  common.npm(["ls", "--dev"], opts, function (er, c, out) {
    if (er) throw er
    t.equal(c, 0)
    t.has(out, /(empty)/
      , "output contains (empty)")
    t.end()
  })
})

test("npm ls --production", function (t) {
  common.npm(["ls", "--production"], opts, function (er, c, out) {
    if (er) throw er
    t.equal(c, 0)
    t.has(out, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.end()
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})
