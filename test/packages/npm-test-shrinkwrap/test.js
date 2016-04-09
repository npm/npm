var common = require("../../common")
var assert = require("assert")

process.env.npm_config_prefix = process.cwd()
delete process.env.npm_config_global
delete process.env.npm_config_depth

var npm = process.env.npm_execpath

require("child_process").execFile(process.execPath, [npm, "ls", "--json"], {
    stdio: "pipe", env: process.env, cwd: process.cwd() },
    function (err, stdout, stderr) {
  if (err) throw err

  var actual = JSON.parse(stdout).dependencies
  var expected = require("./npm-shrinkwrap.json").dependencies

  actual = common.rmFrom(actual.dependencies)
  expected = common.rmFrom(expected)

  console.error(JSON.stringify(actual, null, 2))
  console.error(JSON.stringify(expected, null, 2))

  assert.deepEqual(actual, expected)
})
