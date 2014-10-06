var test = require("tap").test
var common = require("../common-tap")
var fs = require("fs")
var node = process.execPath
var npm = require.resolve("../../bin/npm-cli.js")
var rimraf = require("rimraf")
var mr = require("npm-registry-mock")
var common = require("../common-tap.js")
var spawn = require("child_process").spawn
var env = process.env
var path = require("path")

process.env.npm_config_depth = "Infinity"

var pkg = path.resolve(__dirname, "prune")
var cache = path.resolve(pkg, "cache")
var nodeModules = path.resolve(pkg, "node_modules")

var EXEC_OPTS = { cwd: pkg, env: env }
var server

test("reg mock", function (t) {
  mr(common.port, function (s) {
    server = s
    t.pass("registry mock started")
    t.end()
  })
})

function cleanupCache() {
  rimraf.sync(cache)
  rimraf.sync(nodeModules)
}
function cleanup () { cleanupCache() }

test("setup", function(t) {
  cleanup()
  t.pass("setup")
  t.end()
})

test("npm install", function (t) {
  common.npm([
    "install",
    "--cache", cache,
    "--registry", common.registry,
    "--loglevel", "silent",
    "--production", "false"
  ], EXEC_OPTS, function(err, code, stdout, stderr) {
    t.notOk(code, "exit ok")
    t.notOk(stderr, "Should not get data on stderr: " + stderr)
    t.end()
  })
})

test("npm install test-package", function (t) {
  common.npm([
    "install", "test-package",
    "--cache", cache,
    "--registry", common.registry,
    "--loglevel", "silent",
    "--production", "false"
  ], EXEC_OPTS, function(err, code, stdout, stderr) {
    t.notOk(code, "exit ok")
    t.notOk(stderr, "Should not get data on stderr: " + stderr)
    t.end()
  })
})

test("verify installs", function (t) {
  var dirs = fs.readdirSync(pkg + "/node_modules").sort()
  t.same(dirs, [ "test-package", "mkdirp", "underscore" ].sort())
  t.end()
})

test("npm prune", function (t) {
  common.npm([
    "prune",
    "--loglevel", "silent",
    "--production", "false"
  ], EXEC_OPTS, function(err, code, stdout, stderr) {
    t.notOk(code, "exit ok")
    t.notOk(stderr, "Should not get data on stderr: " + stderr)
    t.end()
  })
})

test("verify installs", function (t) {
  var dirs = fs.readdirSync(pkg + "/node_modules").sort()
  t.same(dirs, [ "mkdirp", "underscore" ])
  t.end()
})

test("npm prune", function (t) {
  common.npm([
    "prune",
    "--loglevel", "silent",
    "--production"
  ], EXEC_OPTS, function(err, code, stderr, stdout) {
    t.notOk(code, "exit ok")
    t.notOk(stderr, "Should not get data on stderr: " + stderr)
    t.end()
  })
})

test("verify installs", function (t) {
  var dirs = fs.readdirSync(pkg + "/node_modules").sort()
  t.same(dirs, [ "underscore" ])
  t.end()
})

test("cleanup", function (t) {
  server.close()
  t.pass("cleaned up")
  t.end()
})
