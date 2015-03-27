var path = require("path")
var test = require("tap").test
var common = require("../common-tap.js")
var link = path.join(__dirname, "link")
var linkInstall = path.join(__dirname, "link-install")

test("setup", function (t) {
  common.npm(["ls", "-g", "--depth=0"], {}, function (err, c, out) {
    t.ifError(err)
    t.equal(c, 0, "set up ok")
    t.notOk(out.match(/UNMET DEPENDENCY foo@/), "foo isn't in global")
    t.end()
  })
});

test("creates global link", function (t) {
  process.chdir(link)
  common.npm("link", {}, function (err,c , out) {
    t.ifError(err, "link has no error")
    common.npm(["ls", "-g"], {}, function (err, c, out) {
      t.ifError(err)
      t.equal(c, 0)
      t.has(out, /foo@1.0.0/, "creates global link ok")
      t.end()
    })
  })
})

test("link-install the package", function (t) {
  process.chdir(linkInstall)
  common.npm(["link", "foo"], {}, function (err) {
    t.ifError(err, "link-install has no error")
    common.npm("ls", {}, function (err, c, out) {
      t.ifError(err)
      t.equal(c, 1)
      t.has(out, /foo@1.0.0/, "link-install ok")
      t.end()
    })
  });
})

test("cleanup", function (t) {
  common.npm(["rm", "foo"], {}, function (err, code) {
    t.equal(code, 0, "cleanup foo in local ok")
    common.npm(["rm", "-g", "foo"], {}, function (err, code) {
      t.equal(code, 0, "cleanup foo in global ok")
      t.end()
    })
  })
})
