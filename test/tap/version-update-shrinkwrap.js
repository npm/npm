var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var npmc = require.resolve("../../")
var osenv = require("osenv")
var path = require("path")
var fs = require("fs")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var which = require("which")
var util = require("util")
var spawn = require("child_process").spawn

var pkg = path.resolve(__dirname, "version-shrinkwrap")
var cache = path.resolve(pkg, "cache")

test("npm version <semver> updates shrinkwrap - no git", function (t) {
  setup()
  npm.load({ cache: pkg + '/cache', registry: common.registry}, function () {
    npm.commands.version(['patch'], function(err) {
      if (err) return t.fail('Error perform version patch')
      var shrinkwrap = require(pkg+'/npm-shrinkwrap')
      if (shrinkwrap.version !== '0.0.1') t.fail(shrinkwrap.version+' !== \'0.0.1\'')
      t.ok('0.0.1' === shrinkwrap.version)
      t.end()
    })
  })
})

test("npm version <semver> updates shrinkwrap and updates git", function (t) {
  setup()
  npm.load({ cache: cache, registry: common.registry}, function () {
    which("git", function(err, git) {
      if (err) t.fail("Git not installed, or which git command error") 
      function checkCommit(_cb) {
        var child1 = spawn(git, ["show", "HEAD", "--name-only"])
        var out = ""
        child1.stdout.on("data", function(d) {
          out += d.toString()
        })
        child1.on("exit", function() {
          return _cb(null, out)
        })
      }

      var child2 = spawn(git, ["init"])
      child2.stdout.pipe(process.stdout)
      child2.on("exit", function() {
        npm.commands.version(["patch"], function(err) {
          if (err) return t.fail("Error perform version patch" + err)
          checkCommit(function(err, files) {
            t.notEqual(files.split('\n').indexOf("package.json"), -1, "package.json not commited")
            t.notEqual(files.split('\n').indexOf("npm-shrinkwrap.json"), -1, "npm-shrinkwrap.json not commited")
            t.pass("npm-shrinkwrap updated and commited")
            t.end()
          })
        })
      })
    })
  })
})

test("cleanup", function(t) {
  // windows fix for locked files
  process.chdir(osenv.tmpdir())

  rimraf.sync(pkg)
  t.end()
})

function setup() {
  mkdirp.sync(pkg)
  mkdirp.sync(cache)
  var contents = {
    author: "Nathan Bowser && Faiq Raza",
    name: "version-with-shrinkwrap-test",
    version: "0.0.0",
    description: "Test for version with shrinkwrap update"
  }

  fs.writeFileSync(path.resolve(pkg, "package.json"), JSON.stringify(contents), "utf8")
  fs.writeFileSync(path.resolve(pkg, "npm-shrinkwrap.json"), JSON.stringify(contents), "utf8")
  process.chdir(pkg)
}
