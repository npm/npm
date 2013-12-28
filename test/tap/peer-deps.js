var common = require("../common-tap.js")
var fs = require("fs")
var test = require("tap").test
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")

var npm = require("../../")

var mr = require("npm-registry-mock")

var pkg = __dirname + "/peer-deps"

var execFile = require('child_process').execFile
var spawn = require('child_process').spawn

var npm = require.resolve("../../bin/npm-cli.js")

process.env.npm_config_prefix = process.cwd()
delete process.env.npm_config_global
delete process.env.npm_config_depth

var gist = "/domenic/3971128/raw/7472b26a013ceb174c2d726314e9fa97465729bb/" +
  "index.js"
var customMocks = {
  "get": {}
}
customMocks.get[gist] = [200, __dirname + "/peer-deps/gist.js"]

test("peer-deps", function (t) {
  t.plan(1)
  cleanup()

  fs.writeFileSync(pkg + "/package.json", JSON.stringify({
    "author": "Domenic Denicola <domenic@domenicdenicola.com> (http://domenicdenicola.com/)",
    "name": "npm-test-peer-deps",
    "version": "0.0.0",
    "dependencies": {
      "npm-test-peer-deps-file": "http://localhost:" + common.port
        + "/domenic/3971128/raw/7472b26a013ceb174c2d726314e9fa97465729bb/index.js"
    },
    "scripts": {
      "test": "node test.js"
    }
  }), 'utf8')

  fs.writeFileSync(pkg + "/npm-ls.json", JSON.stringify({
    "npm-test-peer-deps-file": {
      "version": "1.2.3",
      "from": common.registry
        + "/domenic/3971128/raw/7472b26a013ceb174c2d726314e9fa97465729bb/index.js",
      "resolved": common.registry +
        + "/domenic/3971128/raw/7472b26a013ceb174c2d726314e9fa97465729bb/index.js",
      "dependencies": {
        "underscore": {
          "version": "1.3.1",
          "from": "underscore@1.3.1"
        }
      }
    },
    "request": {
      "version": "0.9.5",
      "from": "request@0.9.5"
    }
  }), 'utf8')

  mkdirp.sync(pkg + "/cache")
  process.chdir(pkg)

  mr({port: common.port, mocks: customMocks}, function (s) {
    var child = spawn(process.execPath, [npm, "install"], {
      env: {
        npm_config_registry: common.registry,
        npm_config_cache_lock_stale: 1000,
        npm_config_cache_lock_wait: 1000,
        npm_config_cache: pkg + "/cache",
        HOME: process.env.HOME,
        Path: process.env.PATH,
        PATH: process.env.PATH
      },
      cwd: pkg
    })
    child.on("close", function () {
      var testChild = execFile(process.execPath,
        [npm, "ls", "--json"], {
          env: {
            npm_config_registry: common.registry,
            npm_config_cache_lock_stale: 1000,
            npm_config_cache_lock_wait: 1000,
            npm_config_cache_lock_wait: 1000,
            npm_config_cache: pkg + "/cache",
            HOME: process.env.HOME,
            Path: process.env.PATH,
            PATH: process.env.PATH
          },
          cwd: pkg
        },
          function (err, stdout, stderr) {
            if (err) throw err

            var actual = JSON.parse(stdout).dependencies
            var expected = require(pkg + "/npm-ls.json")

            // resolved url doesn't matter
            clean(actual)
            clean(expected)

            console.error(JSON.stringify(actual, null, 2))
            console.error(JSON.stringify(expected, null, 2))

            t.deepEqual(actual, expected)
            s.close()
            t.end()
      })

      function clean (obj) {
        for (var i in obj) {
          if (i === "from" || i === "resolved")
            delete obj[i]
          else if (typeof obj[i] === "object" && obj[i])
            clean(obj[i])
        }
      }
    })
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  rimraf.sync(pkg + "/npm-ls.json")
  rimraf.sync(pkg + "/package.json")
  rimraf.sync(pkg + "/node_modules")
  rimraf.sync(pkg + "/cache")
}
