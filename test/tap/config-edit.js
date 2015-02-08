var fs = require("fs")
var os = require("os")
var mkdirp = require("mkdirp")
var path = require("path")
var child_process = require("child_process")
var ini = require("ini")
var test = require("tap").test
var npmconf = require("../../lib/config/core.js")
var common = require("./00-config-setup.js")
var npm = require("../common-tap.js").npm

test("saving configs", function (t) {
  var tmp = '~/tmp/'//os.tmpdir()
  var dirName = 'npm-global-edit-prefix-test-' + Date.now()
  var prefixPath = path.join(tmp, dirName)
  mkdirp(prefixPath, "0777", function (er, prefixPath) {
    if (er)
      throw er
    var editorPath = path.resolve("../editor.js")
    var command = "npm config --prefix=\"" + prefixPath + "\" edit --global"
    var opts = { cwd: __dirname, env: { EDITOR: editorPath } }
    npm(
      [
        "config",
        "--prefix=\"" + prefixPath + "\"",
        "--global",
        "edit"
      ],
      opts,
      function (err, code, stdout, stderr) {
        t.ifError(err)

        t.equal(stderr, "", "got nothing on stderr")
        t.equal(code, 0, "exit ok")
        t.equal(stdout, "success\n", "got success message")
        t.end()
      }
    )
  })
})
