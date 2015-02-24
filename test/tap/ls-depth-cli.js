var common = require('../common-tap')
var test = require('tap').test
var path = require('path')
var rimraf = require('rimraf')
var osenv = require('osenv')
var mkdirp = require('mkdirp')
var pkg = path.resolve(__dirname, 'ls-depth')
var mr = require('npm-registry-mock')
var opts = {cwd: pkg}


function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg + '/cache')
  rimraf.sync(pkg + '/tmp')
  rimraf.sync(pkg + '/node_modules')
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg + '/cache')
  mkdirp.sync(pkg + '/tmp')
  mr({port : common.port}, function (er, s) {
    var cmd = ['install', '--registry=' + common.registry]
    common.npm(cmd, opts, function (er, c) {
      if (er) throw er
      t.equal(c, 0)
      s.close()
      t.end()
    })
  })
})

test('npm ls --depth=0', function (t) {
  common.npm(['ls', '--depth=0'], opts, function (er, c, out) {
    if (er) throw er
    t.equal(c, 0)
    t.has(out, /test-package-with-one-dep@0\.0\.0/
      , 'output contains test-package-with-one-dep@0.0.0')
    t.doesNotHave(out, /test-package@0\.0\.0/
      , 'output not contains test-package@0.0.0')
    t.end()
  })
})

test('npm ls --depth=1', function (t) {
  common.npm(['ls', '--depth=1'], opts, function (er, c, out) {
    if (er) throw er
    t.equal(c, 0)
    t.has(out, /test-package-with-one-dep@0\.0\.0/
      , 'output contains test-package-with-one-dep@0.0.0')
    t.has(out, /test-package@0\.0\.0/
      , 'output contains test-package@0.0.0')
    t.end()
  })
})

test('npm ls --depth=Infinity', function (t) {
  // travis has a preconfigured depth=0, in general we can not depend
  // on the default value in all environments, so explictly set it here
  common.npm(['ls', '--depth=Infinity'], opts, function (er, c, out) {
    if (er) throw er
    t.equal(c, 0)
    t.has(out, /test-package-with-one-dep@0\.0\.0/
      , 'output contains test-package-with-one-dep@0.0.0')
    t.has(out, /test-package@0\.0\.0/
      , 'output contains test-package@0.0.0')
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
