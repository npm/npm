var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var osenv = require('osenv')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.join(__dirname, 'install-development')
//shared with ./install-development.js

test("setup", function (t) {
  rimraf.sync(path.resolve(pkg, 'node_modules'))
  process.chdir(pkg)
  t.end()
})

test('"npm install . --production" should install dependencies', function(t) {
  npm.load(function() {
    npm.config.set("development", false)
    npm.config.set("production", true)
    npm.commands.install(['.'], function(err) {
      var p = path.resolve(pkg, 'node_modules/foo/package.json')
      t.ok(JSON.parse(fs.readFileSync(p, 'utf8')), "foo was installed")
      p = path.resolve(pkg, 'node_modules/format-package-json/package.json')
      t.notOk(fs.existsSync(p), "format-package-json was not installed")
      t.end()
    })
  })
})

test('cleanup', function(t) {
  process.chdir(__dirname)
  rimraf.sync(path.resolve(pkg, 'node_modules'))
  t.end()
})


