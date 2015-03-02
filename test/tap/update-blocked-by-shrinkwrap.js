// the presence of `npm-shrinkwrap.json` should block
// `npm update`
var common = require("../common-tap")
var path = require("path")
var test = require("tap").test
var rimraf = require("rimraf")
var npm = require("../../")
var npmlog = require("npmlog")
var mr = require("npm-registry-mock")

var osenv = require("osenv")
var mkdirp = require("mkdirp")
var fs = require("fs")


var PKG_DIR = path.resolve(__dirname, "update-blocked-by-shrinkwrap")
var cache = path.resolve(PKG_DIR, "cache")

var pj = JSON.stringify({
  "name": "silly",
  "description": "some text",
  "version": "1.2.3",
  "main": "index.js",
  "dependencies": {
    "underscore": "^1.3.1"
  },
  "repository": "git://github.com/luk-/whatever"
}, null, 2)

var wrap = JSON.stringify({
  "name": "silly",
  "version": "1.2.3",
  "dependencies": {
    "underscore": {
      "version": "1.3.1",
      "from": "underscore@1.3.1",
      "resolved": "https://registry.npmjs.org/underscore/-/underscore-1.3.1.tgz"
    }
  }
}, null, 2)


function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)
}

function setup () {
  mkdirp.sync(PKG_DIR)
  process.chdir(PKG_DIR)

  fs.writeFileSync(path.resolve(PKG_DIR, "package.json"), pj);
  fs.writeFileSync(path.resolve(PKG_DIR, "npm-shrinkwrap.json"), wrap);
  mkdirp.sync(path.resolve(PKG_DIR, "cache"));
}

test("setup", function (t) {
  cleanup()
  setup()

  t.end()
})

test("outdated reports underscore is outdated", function (t) {
  var log = []

  process.chdir(PKG_DIR)

  mr({port: common.port}, function (er, s) {
    npm.load({
      cache: cache,
      loglevel: "silent",
      regsitry: common.registry,
      depth: 0
    }
    , function () {
      npmlog.on("log", function (c) {
        log.push(c.level + " " + c.message);
      })

      npm.install(".", function (er) {
        if (er) {
          throw new Error(er);
        }
        npm.outdated(function (err, d) {
          if (err) {
            throw new Error(err);
          }
          t.equal(d[0][0], PKG_DIR)
          t.equal(d[0][1], "underscore")
          t.equal(d[0][2], "1.3.1", "underscore is outdated")

          npm.update(function (e) {
            t.ok(e === null, "doesn't return error object")
            t.similar(log[log.length - 1],
                      /blocked-by-shrinkwrap Cannot update:/, "but logs error")
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


