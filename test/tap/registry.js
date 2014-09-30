// Run all the tests in the `npm-registry-couchapp` suite
// This verifies that the server-side stuff still works.

var common = require("../common-tap")
var test = require("tap").test

var spawn = require("child_process").spawn
var npmExec = require.resolve("../../bin/npm-cli.js")
var path = require("path")
var ca = path.resolve(__dirname, "../../node_modules/npm-registry-couchapp")

var which = require("which")

which("couchdb", function(er, couch) {
  if (er) {
    return test("need couchdb", function (t) {
      t.fail("need couch to run test: " + er.message)
      t.end()
    })
  } else {
    runTests()
  }
})

function runTests () {
  var env = {}
  for (var i in process.env) env[i] = process.env[i]
  env.npm = npmExec

  var opts = {
    cwd: ca,
    stdio: "inherit"
  }
  common.npm(['install'], opts, function(err, code) {
    if (code) {
      return test("need install to work", function (t) {
        t.fail("install failed with: " + (code || sig))
        t.end()
      })

    } else {
      opts = {
        cwd: ca,
        env: env,
        stdio: "inherit"
      }
      common.npm(['test'], opts, function(err, code) {
        opts = {
          cwd: ca,
          env: env,
          stdio: "inherit"
        }
        common.npm(['prune', '--production'], opts, function(err, code) {
          process.exit(code || 0)
        })
      })
    }
  })
}
