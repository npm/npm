var path = require("path")
var test = require("tap").test
var fs = require("fs")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var common = require("../common-tap.js")
var npm = require("../../")
var fs = require("graceful-fs")

var getLogDir = require("../../lib/utils/logfile").getLogDir
var findLogs = require("../../lib/utils/logfile").findLogs

var pkg = path.resolve(__dirname, "logfile-finds-logfiles")
var cache = path.resolve(pkg, "cache")

test("setup", function (t) {
  cleanup()
  mkdirp.sync(cache)
  t.end()
})

test("finds logfiles", function (t) {
  npm.load({cache: cache}, function () {
    var logdir = getLogDir()

    // create some stale logfiles
    mkdirp.sync(logdir)
    fs.writeFileSync(path.join(logdir, "npm-debug-1.log"),
                     "log file content")
    fs.writeFileSync(path.join(logdir, "npm-debug-2.log"),
                     "more log file content")

    findLogs(logdir, function (er, logs) {
      t.notOk(er, "error finding logs")
      t.equal(2, logs.length, "expected 2 log files")
      t.equal(logs[0].name
            , path.resolve(logdir, "npm-debug-1.log")
            , "expected named log file")
      t.end()
    })
  })
})

function cleanup () {
  rimraf.sync(pkg)
}

test("clean", function (t) {
  cleanup()
  t.end()
})
