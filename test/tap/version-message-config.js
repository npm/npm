var common = require("../common-tap.js")
var test = require("tap").test
var common = require("../common-tap.js")
var osenv = require("osenv")
var path = require("path")
var fs = require("fs")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var which = require("which")
var spawn = require("child_process").spawn

var pkg = path.resolve(__dirname, "version-message-config")
var opts = { cwd: pkg }
var cache = path.resolve(pkg, "cache")
var npmrcPath = path.resolve(pkg, ".npmrc")
var packagePath = path.resolve(pkg, "package.json")

test("npm version <semver> with message config", function (t) {
  setup()
    which("git", function (err, git) {
      t.ifError(err, "git found")

      function gitInit(_cb) {
        var child = spawn(git, ["init"])
        var out = ""
        child.stdout.on("data", function (d) {
          out += d.toString()
        })
        child.on("exit", function () {
          return _cb(out)
        })
      }

      function addConfig(_cb) {
          var data = "message = \":bookmark: %s\""
          fs.writeFileSync(npmrcPath, data, "ascii")
      }

      function addPackageJSON(_cb) {
          var data = JSON.stringify({ name: "blah", version: "0.1.2" })
          fs.writeFileSync(packagePath, data, "ascii")
      }

      function gitLog(_cb) {
          var child = spawn(git, ["log"])
          var out = ""
          child.stdout.on("data", function (d) {
            out += d.toString()
          })
          child.on("exit", function () {
              _cb(out)
          })
      }

      gitInit(function() {
        addPackageJSON()
        addConfig()
        common.npm([
            "version",
            "patch",
            "--userconfig=" + npmrcPath
          ],
          opts,
          function (err, code, stdout, stderr) {
            t.ifError(err)
            gitLog(function (log) {
              t.ok(log.match(/:bookmark: 0\.1\.3/g))
              t.end()
            })
          }
        )
      })
    })
})

test("cleanup", function (t) {
  // windows fix for locked files
  process.chdir(osenv.tmpdir())

  rimraf.sync(pkg)
  t.end()
})

function setup() {
  mkdirp.sync(pkg)
  mkdirp.sync(cache)
  process.chdir(pkg)
}
