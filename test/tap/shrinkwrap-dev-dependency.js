var npm = npm = require("../../")
var test = require("tap").test
var path = require("path")
var fs = require("fs")
var osenv = require("osenv")
var rimraf = require("rimraf")
var mr = require("npm-registry-mock")
var common = require("../common-tap.js")

var pkg = path.resolve(__dirname, "shrinkwrap-dev-dependency")
var desiredResultsPath = path.resolve(pkg, "desired-shrinkwrap-results.json")

test("shrinkwrap doesn't strip out the dependency", function (t) {
  t.plan(1)

  mr({port : common.port}, function (er, s) {
    setup({}, function (err) {
      if (err) return t.fail(err)

      npm.install(".", function (err) {
        if (err) return t.fail(err)

        npm.commands.shrinkwrap([], true, function (err, results) {
          if (err) return t.fail(err)

          fs.readFile(desiredResultsPath, function (err, desired) {
            if (err) return t.fail(err)

            t.deepEqual(results, JSON.parse(desired))
            s.close()
            t.end()
          })
        })
      })
    })
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})


function setup (opts, cb) {
  cleanup()
  process.chdir(pkg)

  var allOpts = {
    cache: path.resolve(pkg, "cache"),
    registry: common.registry
  }

  for (var key in opts) {
    allOpts[key] = opts[key]
  }

  npm.load(allOpts, cb)
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(path.resolve(pkg, "node_modules"))
  rimraf.sync(path.resolve(pkg, "cache"))
  rimraf.sync(path.resolve(pkg, "npm-shrinkwrap.json"))
}
