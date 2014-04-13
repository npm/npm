var test = require("tap").test
var npm = require.resolve("../../bin/npm-cli.js")
var node = process.execPath
var exec = require("child_process").exec
var path = require("path")
var pkg = path.resolve(__dirname, "install-prepublish")

test("prepublish runs on install", function (t) {
  t.plan(2)
  exec([node, npm, "install"].join(" "), {
    cwd: pkg
  }, function(err, stdout) {
    t.ifError(err)
    t.ok(stdout.match(/prepublish ran\./))
  })
})

test("prepublish does not run on install --production", function (t) {
  t.plan(2)
  exec([node, npm, "install", "--production"].join(" "), {
    cwd: pkg
  }, function(err, stdout) {
    t.ifError(err)
    t.ok(!stdout.match(/prepublish ran\./))
  })
})

