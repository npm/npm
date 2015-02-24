var test = require('tap').test
var fs = require('fs')
var path = require('path')
var existsSync = fs.existsSync || path.existsSync
var rimraf = require('rimraf')
var mr = require('npm-registry-mock')
var common = require('../common-tap.js')

var EXEC_OPTS = {}

test('dedupe finds the common module and moves it up one level', function (t) {
  setup(function (s) {
    common.npm(
    [
      'install', '.',
      '--registry', common.registry
    ],
    EXEC_OPTS,
    function (err, code) {
      t.ifError(err, 'successfully installed directory')
      t.equal(code, 0, 'npm install exited with code')
      common.npm(['dedupe'], {}, function (err, code) {
        t.ifError(err, 'successfully deduped against previous install')
        t.notOk(code, 'npm dedupe exited with code')
        t.ok(existsSync(path.join(__dirname, 'dedupe', 'node_modules', 'minimist')))
        t.ok(!existsSync(path.join(__dirname, 'dedupe', 'node_modules', 'checker')))
        s.close() // shutdown mock registry.
        t.end()
      })
    })
  })
})

function setup (cb) {
  process.chdir(path.join(__dirname, 'dedupe'))
  mr({port : common.port}, function (er, s) { // create mock registry.
    rimraf.sync(path.join(__dirname, 'dedupe', 'node_modules'))
    fs.mkdirSync(path.join(__dirname, 'dedupe', 'node_modules'))
    cb(s)
  })
}
