var test = require("tap").test
var npm = require.resolve("../../bin/npm-cli.js")

var spawn = require("child_process").spawn
var node = process.execPath

// ignore-scripts/package.json has preinstall and prepublish scripts that always
// exit with non-zero error codes.
var pkg = __dirname + "/ignore-scripts"

test("ignore-scripts: using the option", function(t) {
  createChild([npm, "install", "--ignore-scripts"]).on("close", function(code) {
    t.equal(code, 0)
    t.end()
  })
})

test("ignore-scripts: NOT using the option", function(t) {
  createChild([npm, "install"]).on("close", function(code) {
    t.notEqual(code, 0)
    t.end()
  })
})

function createChild (args) {
  var env = {
    HOME: process.env.HOME,
    Path: process.env.PATH,
    PATH: process.env.PATH
  }

  if (process.platform === "win32")
    env.npm_config_cache = "%APPDATA%\\npm-cache"

  return spawn(node, args, {
    cwd: pkg,
    stdio: "inherit",
    env: env
  })
}
