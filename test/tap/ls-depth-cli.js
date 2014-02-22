var common = require('../common-tap')
  , test = require('tap').test
  , path = require('path')
  , spawn = require('child_process').spawn
  , rimraf = require('rimraf')
  , mkdirp = require('mkdirp')
  , pkg = __dirname + '/ls-depth'
  , cache = pkg + '/cache'
  , tmp = pkg + '/tmp'
  , node = process.execPath
  , npm = path.resolve(__dirname, '../../cli.js')
  , mr = require('npm-registry-mock')

function run (command, t, cb) {
  var c = ''
    , child = spawn(node, command, {
      cwd: pkg
    })

    child.stdout.on('data', function (chunk) {
      c += chunk
    })

    child.stdout.on('end', function () {
      if (test)
        cb(t, c)
      else
        t.end()
    })
}

function cleanup () {
  rimraf.sync(pkg + '/cache')
  rimraf.sync(pkg + '/tmp')
  rimraf.sync(pkg + '/node_modules')
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg + '/cache')
  mkdirp.sync(pkg + '/tmp')
  mr(common.port, function (s) {
    run([npm, 'install', '--registry=' + common.registry], t, function (t, c) {
      s.close()
      t.end()
    })
  })
})

test('npm ls --depth=0', function (t) {
  run([npm, 'ls', '--depth=0'], t, function (t, c) {
    t.has(c, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.doesNotHave(c, /test-package@0\.0\.0/
      , "output not contains test-package@0.0.0")
    t.end()
  })
})

test('npm ls --depth=1', function (t) {
  run([npm, 'ls', '--depth=1'], t, function (t, c) {
    t.has(c, /test-package-with-one-dep@0\.0\.0/
      , "output contains test-package-with-one-dep@0.0.0")
    t.has(c, /test-package@0\.0\.0/
      , "output contains test-package@0.0.0")
    t.end()
  })
})

test('npm ls (no depth defined)', function (t) {
  run([npm, 'ls'], t, function (t, c) {
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
