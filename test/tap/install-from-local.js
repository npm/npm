var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.join(__dirname, 'install-from-local', 'package-with-local-paths')

test("setup", function (t) {
  process.chdir(pkg)
  t.end()
})

test('"npm install" should install local packages', function(t) {

  npm.load(function() {
    npm.commands.install(['.'], function(err) {
      t.ifError(err)
      var dependencyPackageJson = path.resolve(pkg, 'node_modules/package-local-dependency/package.json')
      t.ok(JSON.parse(fs.readFileSync(dependencyPackageJson, 'utf8')))

      var devDependencyPackageJson = path.resolve(pkg, 'node_modules/package-local-dev-dependency/package.json')
      t.ok(JSON.parse(fs.readFileSync(devDependencyPackageJson, 'utf8')))

      t.end()
    })
  })
})

test('cleanup', function(t) {
  process.chdir(__dirname)
  rimraf.sync(path.resolve(pkg, 'node_modules'))
  t.end()
})
