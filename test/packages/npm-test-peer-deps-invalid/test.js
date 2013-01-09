var path = require("path")
var assert = require("assert")

process.env.npm_config_prefix = process.cwd()
delete process.env.npm_config_global
delete process.env.npm_config_depth

var npm = process.env.npm_execpath

require("child_process").exec(npm + " ls --json", {
    env: process.env, cwd: process.cwd() },
    function (err, stdout, stderr) {

  var actual = JSON.parse(stdout).dependencies
  var expected = require("./npm-ls.json").dependencies

  // Delete the "problems" entry because it contains system-specific path info,
  // so we can't compare it accurately and thus have deleted it from
  // ./npm-ls.json.
  delete actual.dict.problems

  assert.deepEqual(actual, expected)

  assert.ok(err)
  assert(/peer invalid/.test(err.message))
})
