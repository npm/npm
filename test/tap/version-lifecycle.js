var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var osenv = require("osenv")
var path = require("path")
var fs = require("fs")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")

var pkg = path.resolve(__dirname, "version-lifecycle")
var cache = path.resolve(pkg, "cache")

test("npm version <semver> with failing preversion lifecycle script", function(t) {
  setup()
  fs.writeFileSync(path.resolve(pkg, "package.json"), JSON.stringify({
    author: "Alex Wolfe",
    name: "version-lifecycle",
    version: "0.0.0",
    description: "Test for npm version if preversion script fails",
    scripts: {
      preversion: './fail.sh'
    }
  }), "utf8")
  fs.writeFileSync(path.resolve(pkg, "fail.sh"), 'exit 50', {mode: 448})
  npm.load({cache: cache, registry: common.registry}, function() {
    var version = require("../../lib/version")
    version(["patch"], function(err) {
      t.ok(err)
      t.ok(err.message.match(/Exit status 50/))
      t.end()
    })
  })
})

test("npm version <semver> with failing postversion lifecycle script", function(t) {
  setup()
  fs.writeFileSync(path.resolve(pkg, "package.json"), JSON.stringify({
    author: "Alex Wolfe",
    name: "version-lifecycle",
    version: "0.0.0",
    description: "Test for npm version if postversion script fails",
    scripts: {
      postversion: './fail.sh'
    }
  }), "utf8")
  fs.writeFileSync(path.resolve(pkg, "fail.sh"), 'exit 50', {mode: 448})
  npm.load({cache: cache, registry: common.registry}, function() {
    var version = require("../../lib/version")
    version(["patch"], function(err) {
      t.ok(err)
      t.ok(err.message.match(/Exit status 50/))
      t.end()
    })
  })
})

test("cleanup", function(t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  t.end()
})

function setup() {
  mkdirp.sync(pkg)
  mkdirp.sync(path.join(pkg, 'node_modules'))
  mkdirp.sync(cache)
  process.chdir(pkg)
}
