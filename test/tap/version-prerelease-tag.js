var common = require('../common-tap.js')
var fs = require('fs')
var path = require('path')

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var npm = require('../../lib/npm.js')

var pkg = path.resolve(__dirname, 'version-from-git')
var packagePath = path.resolve(pkg, 'package.json')
var cache = path.resolve(pkg, 'cache')

var json = { name: 'version-prerelease', version: '0.1.2' }

test('npm version preprelease with a prerlease tag fail on extra arguments', function (t) {
  var expectedVersion = json.version
  setup()

  npm.load({cache: cache, 'sign-git-tag': false, registry: common.registry}, function () {
    var version = require('../../lib/version')
    version(['prerelease', 'alpha', 'extra-arg'], checkManifest)
  })

  function checkManifest (er) {
    if (!er) {
      t.fail('should fail when extra arguments are passed to prerelease.')
    } else {
      fs.readFile(path.resolve(pkg, 'package.json'), 'utf8', function (er, data) {
        t.ifError(er, 'read manifest without error')
        var manifest = JSON.parse(data)
        t.equal(manifest.version, expectedVersion, 'package.json version did not update')
        t.done()
      })
    }
  }
})

test('npm version preprelease without prerlease tag updates the package.json version', function (t) {
  var expectedVersion = '0.1.3-0'
  setup()

  npm.load({cache: cache, 'sign-git-tag': false, registry: common.registry}, function () {
    var version = require('../../lib/version')
    version(['prerelease'], checkManifest)
  })

  function checkManifest (er) {
    t.ifError(er, 'npm run version ran without error')
    fs.readFile(path.resolve(pkg, 'package.json'), 'utf8', function (er, data) {
      t.ifError(er, 'read manifest without error')
      var manifest = JSON.parse(data)
      t.equal(manifest.version, expectedVersion, 'updated the package.json version')
      t.done()
    })
  }
})

test('npm version preprelease with a prerlease tag updates the package.json version', function (t) {
  var expectedVersion = '0.1.3-alpha.0'
  setup()

  npm.load({cache: cache, 'sign-git-tag': false, registry: common.registry}, function () {
    var version = require('../../lib/version')
    version(['prerelease', 'alpha'], checkManifest)
  })

  function checkManifest (er) {
    t.ifError(er, 'npm run version ran without error')
    fs.readFile(path.resolve(pkg, 'package.json'), 'utf8', function (er, data) {
      t.ifError(er, 'read manifest without error')
      var manifest = JSON.parse(data)
      t.equal(manifest.version, expectedVersion, 'updated the package.json version')
      t.done()
    })
  }
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  // windows fix for locked files
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}

function setup () {
  cleanup()
  mkdirp.sync(cache)
  process.chdir(pkg)
  fs.writeFileSync(packagePath, JSON.stringify(json), 'utf8')
}

