var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")
var fs = require('fs')
var path = require('path')
var mr = require("npm-registry-mock")

var PKG_DIR = path.resolve(__dirname, "update-save")
var PKG = path.resolve(PKG_DIR, "package.json")
var CACHE_DIR = path.resolve(PKG_DIR, "cache")
var MODULES_DIR = path.resolve(PKG_DIR, "node_modules")

var EXEC_OPTS = {
  cwd: PKG_DIR,
  stdio: 'ignore'
}

var DEFAULT_PKG = {
  "name": "update-save-example",
  "version": "1.2.3",
  "dependencies": {
    "mkdirp": "~0.3.0"
  },
  "devDependencies": {
    "underscore": "~1.3.1"
  }
}

var s = undefined

test('setup', function (t) {
  resetPackage()

  mr(common.port, function (server) {
    npm.load({cache: CACHE_DIR, registry: common.registry}, function (err) {
      t.ifError(err)
      s = server
      t.end()
    })
  })
})

test("update regular dependencies only", function (t) {
  resetPackage()

  common.npm(['update', '--save'], EXEC_OPTS, function (err, code) {
    t.ifError(err)
    t.equal(code, 0)
    var pkgdata = JSON.parse(fs.readFileSync(PKG, 'utf8'))
    t.deepEqual(pkgdata.dependencies, {mkdirp: '^0.3.5'}, 'only dependencies updated')
    t.deepEqual(pkgdata.devDependencies, {underscore: '~1.3.1'}, 'dev dependencies should be untouched')
    s.close()
    t.end()
  })
})

test("update devDependencies only", function (t) {
  resetPackage()

  common.npm(['update', '--save-dev'], EXEC_OPTS, function (err, code) {
    t.ifError(err)
    t.equal(code, 0)
    var pkgdata = JSON.parse(fs.readFileSync(PKG, 'utf8'))
    t.deepEqual(pkgdata.devDependencies, {underscore: '^1.3.3'}, 'dev dependencies should be updated')
    t.deepEqual(pkgdata.dependencies, {mkdirp: '~0.3.0'}, 'dependencies should be untouched')
    t.end()
  })
})


function resetPackage() {
  rimraf.sync(CACHE_DIR)
  rimraf.sync(MODULES_DIR)
  mkdirp.sync(CACHE_DIR)

  fs.writeFileSync(PKG, JSON.stringify(DEFAULT_PKG, null, 2), 'ascii')
}

test("cleanup", function (t) {
  resetPackage() // restore package.json
  rimraf.sync(CACHE_DIR)
  rimraf.sync(MODULES_DIR)
  t.end()
})

