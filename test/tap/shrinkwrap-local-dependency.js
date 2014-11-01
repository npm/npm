var npm = npm = require("../../")
var test = require("tap").test
var path = require("path")
var fs = require("fs")
var osenv = require("osenv")
var rimraf = require("rimraf")
var mr = require("npm-registry-mock")
var common = require("../common-tap.js")

var pkg = path.resolve(__dirname, "shrinkwrap-local-dependency")
var desiredResultsPath = path.resolve(pkg, "desired-shrinkwrap-results.json")

test("shrinkwrap uses resolved with file: on local deps", function(t) {
  t.plan(1)

  setup(function(err) {
    if (err) return t.fail(err)

    common.npm(["install", "."], {}, function(err) {
      if (err) return t.fail(err)

      npm.shrinkwrap(".", true, function(err, results) {
        if (err) return t.fail(err)

        fs.readFile(desiredResultsPath, function(err, desired) {
          if (err) return t.fail(err)

          t.deepEqual(results, JSON.parse(desired))
          t.end()
        })
      })
    })
  })
})

test('"npm install" should install local packages from shrinkwrap', function (t) {
  cleanNodeModules();

  common.npm(["install", "."], {}, function (err, code) {
    t.ifError(err, "error should not exist")
    t.notOk(code, "npm install exited with code 0")
    var dependencyPackageJson = path.resolve(pkg, "node_modules/npm-test-shrinkwrap-local-dependency-dep/package.json")
    t.ok(
      JSON.parse(fs.readFileSync(dependencyPackageJson, "utf8")),
      "package with local dependency installed from shrinkwrap"
    )

    t.end()
  })
})

test("cleanup", function(t) {
  cleanup()
  t.end()
})


function setup(cb) {
  cleanup()
  process.chdir(pkg)

  var allOpts = {
    cache: path.resolve(pkg, "cache"),
    registry: common.registry,
    production: true
  }

  npm.load(allOpts, cb)
}

function cleanNodeModules() {
  rimraf.sync(path.resolve(pkg, "node_modules"))
}

function cleanup() {
  process.chdir(osenv.tmpdir())
  cleanNodeModules();
  rimraf.sync(path.resolve(pkg, "cache"))
  rimraf.sync(path.resolve(pkg, "npm-shrinkwrap.json"))
}