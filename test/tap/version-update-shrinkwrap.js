var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var osenv = require("osenv")
var path = require("path")
var fs = require("fs")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var which = require("which")
var spawn = require("child_process").spawn

var pkg = path.resolve(__dirname, "version-shrinkwrap")
var cache = path.resolve(pkg, "cache")

test("npm version <semver> updates shrinkwrap - no git", function (t) {
  setup()
  npm.load({ cache: pkg + "/cache", registry: common.registry}, function () {
    npm.commands.version(["patch"], function(err) {
      if (err) return t.fail("Error perform version patch")
      var shrinkwrap = require(pkg+"/npm-shrinkwrap")
      if (shrinkwrap.version !== "0.0.1") t.fail(shrinkwrap.version+" !== \'0.0.1\'")
      t.ok(shrinkwrap.version === "0.0.1")
      t.end()
    })
  })
})

test("npm version <semver> updates git works with no shrinkwrap", function (t) {
  setup()

  rimraf.sync(path.resolve(pkg, "npm-shrinkwrap.json"))

  npm.load({ cache: cache, registry: common.registry}, function () {
    which("git", function (err, git) {
      if (err) t.fail("Git not installed, or which git command error")

      initRepo()

      function initRepo () {
        var init = spawn(git, ["init"])
        init.stdout.pipe(process.stdout)
        init.on("exit", function (code) {
          t.notOk(code, "git init exited without issue")

          configName()
        })
      }

      function configName () {
        var namer = spawn(git, ["config", "user.name", "Phantom Faker"])
        namer.stdout.pipe(process.stdout)
        namer.on("exit", function (code) {
          t.notOk(code, "git config user.name exited without issue")

          configEmail()
        })
      }

      function configEmail () {
        var emailer = spawn(git, ["config", "user.email", "nope@not.real"])
        emailer.stdout.pipe(process.stdout)
        emailer.on("exit", function (code) {
          t.notOk(code, "git config user.email exited without issue")

          configKey()
        })
      }

      function configKey () {
        var faker = spawn(git, ["config", "user.signingkey", "xxxxxxxx"])
        faker.stdout.pipe(process.stdout)
        faker.on("exit", function (code) {
          t.notOk(code, "git config user.signingkey exited without issue")

          version()
        })
      }

      function version () {
        npm.commands.version(["patch"], checkCommit)
      }

      function checkCommit () {
        var shower = spawn(git, ["show", "HEAD", "--name-only"])
        var out = "", eout = ""
        shower.stdout.on("data", function (d) {
          out += d.toString()
        })
        shower.stderr.on("data", function (d) {
          eout += d.toString()
        })
        shower.on("exit", function (code) {
          t.notOk(code, "git show HEAD exited without issue")
          t.notOk(err, "git show produced no error output")

          var lines = out.split("\n")
          t.notEqual(lines.indexOf("package.json"), -1, "package.json commited")
          t.equal(lines.indexOf("npm-shrinkwrap.json"), -1, "npm-shrinkwrap.json not present")

          t.end()
        })
      }
    })
  })
})

test("npm version <semver> updates shrinkwrap and updates git", function (t) {
  setup()
  npm.load({ cache: cache, registry: common.registry}, function () {
    which("git", function (err, git) {
      if (err) t.fail("Git not installed, or which git command error")

      initRepo()

      function initRepo () {
        var init = spawn(git, ["init"])
        init.stdout.pipe(process.stdout)
        init.on("exit", function (code) {
          t.notOk(code, "git init exited without issue")

          configName()
        })
      }

      function configName () {
        var namer = spawn(git, ["config", "user.name", "Phantom Faker"])
        namer.stdout.pipe(process.stdout)
        namer.on("exit", function (code) {
          t.notOk(code, "git config user.name exited without issue")

          configEmail()
        })
      }

      function configEmail () {
        var emailer = spawn(git, ["config", "user.email", "nope@not.real"])
        emailer.stdout.pipe(process.stdout)
        emailer.on("exit", function (code) {
          t.notOk(code, "git config user.email exited without issue")

          configKey()
        })
      }

      function configKey () {
        var faker = spawn(git, ["config", "user.signingkey", "xxxxxxxx"])
        faker.stdout.pipe(process.stdout)
        faker.on("exit", function (code) {
          t.notOk(code, "git config user.signingkey exited without issue")

          version()
        })
      }

      function version () {
        npm.commands.version(["patch"], checkCommit)
      }

      function checkCommit () {
        var shower = spawn(git, ["show", "HEAD", "--name-only"])
        var out = "", eout = ""
        shower.stdout.on("data", function (d) {
          out += d.toString()
        })
        shower.stderr.on("data", function (d) {
          eout += d.toString()
        })
        shower.on("exit", function (code) {
          t.notOk(code, "git show HEAD exited without issue")
          t.notOk(err, "git show produced no error output")

          var lines = out.split("\n")
          t.notEqual(lines.indexOf("package.json"), -1, "package.json commited")
          t.notEqual(lines.indexOf("npm-shrinkwrap.json"), -1, "npm-shrinkwrap.json commited")

          t.end()
        })
      }
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
  rimraf.sync(pkg)
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
