var common = require("../common-tap")
var test = require("tap").test
var path = require("path")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")

var pkg = path.resolve(__dirname, "logfile-to-remove")

var logsToRemove = require("../../lib/utils/logfile").logsToRemove

test("setup", function (t) {
  cleanup()
  mkdirp.sync(pkg)
  t.end()
})

test("chooses large logfiles to remove", function (t) {
  var now = new Date()
  var big = 12*1024*1024

  t.deepEqual([{ctime: now, size: big}]
            , logsToRemove([{ctime: now, size: big},
                           ,{ctime: now, size: 20}])
            , "expected large logfile to be removed")
  t.end()
})

test("chooses old logfiles to remove", function (t) {
  var now = new Date()
  var then = new Date(2003,10,29)

  t.deepEqual([{ctime: then, size: 30}]
            , logsToRemove([{ctime: then, size: 30},
                           ,{ctime: now, size: 20}])
            , "expected old logfile to be removed")
  t.end()
})

test("chooses old logfiles to remove", function (t) {
  var now = new Date()
  var logs = []
  var i
  var expected = []

  for (i = 0; i < 30; i += 1) {
    logs[i] = {ctime: new Date(now.getTime() - i), size: i}
  }
  expected = logs.slice(10)

  t.deepEqual(expected
            , logsToRemove(logs)
            , "expected oldest logfiles to be removed")

  t.end()
})

function cleanup() {
  rimraf.sync(pkg)
}

test("clean", function (t) {
  cleanup()
  t.end()
})
