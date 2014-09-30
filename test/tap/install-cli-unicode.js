var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var path = require("path")

var pkg = __dirname + '/install-cli'
var NPM_BIN = __dirname + '/../../bin/npm-cli.js'

function hasOnlyAscii (s) {
  return /^[\000-\177]*$/.test(s) ;
}

var EXEC_OPTS = { }

test('does not use unicode with --unicode false', function (t) {
  t.plan(3)
  mr(common.port, function (s) {
    common.npm(['install', '--unicode', 'false', 'read'], EXEC_OPTS, function(err, code, stdout, stderr) {
      t.ifError(err)
      t.ok(stdout, stdout.length)
      t.ok(hasOnlyAscii(stdout))
      s.close()
    })
  })
})

test('cleanup', function (t) {
  mr(common.port, function (s) {
    common.npm(['uninstall', 'read'], EXEC_OPTS, function(err, code, stdout, stderr) {
      s.close()
    })
  })
  t.end()
})
