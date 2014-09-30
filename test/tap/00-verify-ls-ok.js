var common = require("../common-tap")
var test = require("tap").test
var node = process.execPath
var path = require("path")
var cwd = path.resolve(__dirname, "..", "..")
var npm = path.resolve(cwd, "cli.js")
var spawn = require("child_process").spawn

test("npm ls in npm", function (t) {
  var opt = { cwd: cwd, stdio: [ "ignore", "ignore", 2 ] }
  common.npm(['ls'], opt, function(err, code) {
    t.notOk(code)
    t.end()
  })
})
