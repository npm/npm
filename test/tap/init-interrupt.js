// if "npm init" is interrupted with ^C, don't report
// "init written successfully"
var test = require("tap").test
var path = require("path")
var osenv = require("osenv")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var stream = require("stream")
var common = require("../common-tap.js")
var npmlog = require("npmlog")
var requireInject = require("require-inject")

var npm = require("../../lib/npm.js")

var PKG_DIR = path.resolve(__dirname, "init-interrupt")

test("issue #6684 remove confusing message", function (t) {

  var initJsonMock = function (dir, input, config, cb) {
    process.nextTick(function () {
      cb({ message: "canceled" })
    })
  }              
  initJsonMock.yes = function () { return true; }

  npm.load({loglevel : "warn"}, function () {
    var log = ""
    var init = requireInject("../../lib/init", {
        "init-package-json": initJsonMock
    })

    // capture log messages
    npmlog.on('log', function (chunk) { log = log + chunk.message + "\n" } );

    init([], function (err, code) {
      t.notSimilar(log, /written successfully/)
      t.similar(log, /canceled/)
      t.end()
    })
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})

function cleanup() {
  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)
}
