var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var test = require('tap').test

var common = require('../common-tap.js')
var npm = require('../../')
var pkg = path.resolve(__dirname, 'version-allow-same-version')
var cache = path.resolve(pkg, 'cache')
var npmrc = path.resolve(pkg, './.npmrc')
var configContents = 'sign-git-tag=false\n'

test('npm version <semver> with same version without --allow-same-version', function (t) {
  setup()
  fs.writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify({
    author: 'Lucas Theisen',
    name: 'version-allow-same-version',
    version: '0.0.1',
    description: 'Test for npm version without --allow-same-version'
  }), 'utf8')
  npm.load({cache: cache, 'allow-same-version': false, registry: common.registry}, function () {
    var version = require('../../lib/version')
    version(['0.0.1'], function (err) {
      t.ok(err)
      t.ok(err.message.match(/Version not changed.*/))
      t.end()
    })
  })
})
test('npm version <semver> with same version with --allow-same-version', function (t) {
  setup()
  fs.writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify({
    author: 'Lucas Theisen',
    name: 'version-allow-same-version',
    version: '0.0.1',
    description: 'Test for npm version without --allow-same-version'
  }), 'utf8')
  npm.load({cache: cache, 'allow-same-version': true, registry: common.registry}, function () {
    var version = require('../../lib/version')
    version(['0.0.1'],
      function (err) { t.ok(!err) },
      function () { t.end() })
  })
})

function setup () {
  mkdirp.sync(pkg)
  mkdirp.sync(path.join(pkg, 'node_modules'))
  mkdirp.sync(cache)
  fs.writeFileSync(npmrc, configContents, 'ascii')
  process.chdir(pkg)
}

