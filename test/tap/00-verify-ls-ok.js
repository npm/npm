var common = require("../common-tap")
var test = require("tap").test
var path = require("path")
var cwd = path.resolve(__dirname, "..", "..")
var fs = require("fs")

test("npm ls in npm", function (t) {
  t.ok(fs.existsSync(cwd), "ensure that the path we are calling ls within exists")

  var opt = { cwd: cwd, stdio: [ "ignore", "ignore", 2 ] }
  common.npm(["ls"], opt, function(err, code) {
    t.ifError(err, "error should not exist")
    t.notEqual(code, 0, "npm ls exited with code")
    t.end()
  })
})
