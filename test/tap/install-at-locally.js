var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var osenv = require('osenv')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.join(__dirname, 'install-at-locally')

test('"npm install ./package@1.2.3" should install local pkg', function(t) {
  setup()
  t.plan(1)
  npm.load(function() {
    npm.commands.install(['./package@1.2.3'], function(err) {
      var p = path.resolve(pkg, 'node_modules/install-at-locally/package.json')
      t.ok(JSON.parse(fs.readFileSync(p, 'utf8')))
      t.end()
    })
  })
})

function setup() {
  mkdirp.sync(pkg)
  mkdirp.sync(path.resolve(pkg, 'node_modules'))
  mkdirp.sync(path.resolve(pkg, 'package@1.2.3'))
  fs.writeFileSync(path.resolve(pkg, 'package@1.2.3/package.json'), JSON.stringify({
    name: 'install-at-locally',
    version: '0.0.0',
    description: 'Test for 404-parent',
  }), 'utf8')
  process.chdir(pkg)
}

test('cleanup', function(t) {
  rimraf.sync(pkg)
  t.end()
})

