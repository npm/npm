var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')

var pkg = path.join(__dirname, 'circular-dep-clone')

var EXEC_OPTS = { cwd: pkg }

var json = {
  name: 'circular-dep-clone',
  description: 'fixture',
  version: '0.0.0',
  dependencies: {
    'npm-check-updates': '2.5.7'
  }
}

test('setup', function (t) {
  mkdirp.sync(path.join(pkg, 'node_modules'))
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  process.chdir(pkg)
  t.end()
})

test('\'npm install \' with circular dependencies should not break', function (t) {
  common.npm(['install', '--force'], EXEC_OPTS, function (err, code) {
    t.ifError(err, 'install successful')
    t.equal(code, 0, 'npm install did not raise error code')
    t.end()
  })
})

test('cleanup', function (t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  t.end()
})
