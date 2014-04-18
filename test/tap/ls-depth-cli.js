var common = require('../common-tap')
  , test = require('tap').test
  , path = require('path')
  , rimraf = require('rimraf')
  , osenv = require('osenv')
  , mkdirp = require('mkdirp')
  , pkg = __dirname + '/ls-depth'
  , cache = pkg + '/cache'
  , tmp = pkg + '/tmp'
  , node = process.execPath
  , npm = path.resolve(__dirname, '../../cli.js')
  , mr = require('npm-registry-mock')
  , opts = {cwd: pkg}


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
  mr(common.port, function (s) {
    common.run([
      npm
    , 'install'
    , '--registry=' + common.registry
    ], t, opts
    , function (t, c) {
      s.close()
      t.end()
    })
  })
})

test('npm ls --depth=0', function (t) {
  common.run([npm, 'ls', '--depth=0'], t, opts, function (t, c) {
    t.has(c, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.doesNotHave(c, /test-package@0\.0\.0/
      , "output not contains test-package@0.0.0")
    t.end()
  })
})

test('npm ls --depth=1', function (t) {
  common.run([npm, 'ls', '--depth=1'], t, opts, function (t, c) {
    t.has(c, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.has(c, /test-package@0\.0\.0/
      , "output contains test-package@0.0.0")
    t.end()
  })
})

test('npm ls --depth=Infinity', function (t) {
  // travis has a preconfigured depth=0, in general we can not depend
  // on the default value in all environments, so explictly set it here
  common.run([npm, 'ls', '--depth=Infinity'], t, opts, function (t, c) {
    t.has(c, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.has(c, /test-package@0\.0\.0/
      , "output contains test-package@0.0.0")
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
