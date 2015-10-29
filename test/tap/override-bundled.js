'use strict'
var test = require('tap').test
var fs = require('fs')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var path = require('path')
var common = require('../common-tap.js')

var testdir = path.resolve(__dirname, path.basename(__filename, '.js'))
var testjson = {
  dependencies: {'top-test': 'file:top-test/'}
}

var testmod = path.resolve(testdir, 'top-test')
var testmodjson = {
  name: 'top-test',
  version: '1.0.0',
  dependencies: {'bundle-test': 'file:bundle-test/'},
  bundledDependencies: ['bundle-test']
}

var bundlenew = path.resolve(testmod, 'bundle-test')
var newsource = path.resolve(bundlenew, 'NEW')
var newdest = path.resolve(testdir, 'node_modules', 'top-test', 'node_modules', 'bundle-test', 'NEW')
var bundlebad = path.resolve(testmod, 'node_modules', 'bundle-test')
var bundlejson = {
  name: 'bundle-test',
  version: '1.0.0'
}

function writepjs (dir, content) {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(content, null, 2))
}

function setup () {
  mkdirp.sync(testdir)
  writepjs(testdir, testjson)
  mkdirp.sync(testmod)
  writepjs(testmod, testmodjson)
  mkdirp.sync(bundlenew)
  writepjs(bundlenew, bundlejson)
  fs.writeFileSync(newsource, '')
  mkdirp.sync(bundlebad)
  writepjs(bundlebad, bundlejson)
}

function cleanup () {
  rimraf.sync(testdir)
}

test('setup', function (t) {
  cleanup()
  setup()
  t.end()
})

/*
    finalize: Make finalize ok w/ package.json resulting in bundled dep overrides

    PR-URL: https://github.com/npm/npm/pull/10147

*/
test('bundled', function (t) {
  // This tests that after the install we have a freshly installed version
  // of `bundle-test` (in alignment with the package.json), instead of the
  // version that was bundled with `top-test`.
  // If npm doesn't do this, and selects the bundled version, things go very
  // wrong because npm thinks it has a different module (with different
  // metadata) installed in that location and will go off and try to do
  // _things_ to it.  Things like chmod in particular, which in turn results
  // in the dreaded ENOENT errors.
  common.npm(['install', '--loglevel=warn'], {cwd: testdir}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'npm itself completed ok')
    t.like(stderr, /EPACKAGEJSON override-bundled/, "didn't stomp on other warnings")
    t.like(stderr, /EBUNDLEOVERRIDE/, 'included warning about bundled dep')
    fs.stat(newdest, function (missing) {
      t.ok(!missing, 'package.json overrode bundle')
      t.end()
    })
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
