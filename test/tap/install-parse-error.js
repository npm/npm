var fs = require('graceful-fs')
var path = require('path')

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')

var pkg = path.join(__dirname, 'install-parse-error')

var EXEC_OPTS = { cwd: pkg }

var invalidJson = '{\n' +
  "'name': 'some-name',\n" +
  "'dependencies': {}\n" +
'}'

test('setup', function (t) {
  cleanup()
  mkdirp.sync(path.resolve(pkg, 'node_modules'))
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    invalidJson
  )
  process.chdir(pkg)
  t.end()
})

test('failing to parse package.json should be error', function (t) {
  common.npm(
    [
      'install'
    ],
    EXEC_OPTS,
    function (err, code, stdout, stderr) {
      t.ifError(err, 'install command finished successfully')
      t.equal(code, 1, 'exit not ok')
      t.similar(stderr, /npm ERR! Failed to parse json/m)
      t.end()
    }
  )
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
