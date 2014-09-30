// Run all the tests in the `npm-registry-couchapp` suite
// This verifies that the server-side stuff still works.

var test = require("tap").test

var spawn = require("child_process").spawn
var npmExec = require.resolve("../../bin/npm-cli.js")
var path = require("path")
var ca = path.resolve(__dirname, "../../node_modules/npm-registry-couchapp")

var which = require("which")

var v = process.versions.node.split(".").map(function (n) { return parseInt(n, 10) })
if (v[0] === 0 && v[1] < 10) {
  console.error(
    "WARNING: need a recent Node for npm-registry-couchapp tests to run, have",
    process.versions.node
  )
}
else {
  which("couchdb", function(er) {
    if (er) {
      console.error("WARNING: need couch to run test: " + er.message)
    }
    else {
      runTests()
    }
  })
}


function runTests () {
  var env = {}
  for (var i in process.env) env[i] = process.env[i]
  env.npm = npmExec

  spawn(process.execPath, [
    npmExec, "install"
  ], {
    cwd: ca,
    stdio: "inherit"
  }).on("close", function (code, sig) {
    if (code || sig) {
      return test("need install to work", function (t) {
        t.fail("install failed with: " + (code || sig))
        t.end()
      })

    } else {

      spawn(process.execPath, [
        npmExec, "test"
      ], {
        cwd: ca,
        env: env,
        stdio: "inherit"
      }).on("close", function (code) {
        spawn(process.execPath, [
          npmExec, "prune", "--production"
        ], {
          cwd: ca,
          env: env,
          stdio: "inherit"
        }).on("close", function (code2) {
          process.exit(code || code2 || 0)
        })
      })
    }

  })
}
