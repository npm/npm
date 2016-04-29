if (process.platform === 'win32') {
  console.error('skipping test, because windows and shebangs')
  process.exit(0)
}

var fs = require('fs')
var path = require('path')

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var common = require('../common-tap.js')

var pkg = path.resolve(__dirname, 'lifecycle-runcmd')
var link = path.resolve(pkg, 'node-bin')

var PATH = '/bin:/usr/bin'

var testShFileName = path.join(pkg, 'testsh')

var json = {
  name: 'glorb',
  version: '1.2.3',
  scripts: {
    shell: 'ok'
  }
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )
  fs.writeFileSync(testShFileName, '#!/bin/bash\necho $@\n')
  fs.chmodSync(testShFileName, '755')
  fs.symlinkSync(path.dirname(process.execPath), link, 'dir')
  t.end()
})

test('make sure that nonexistant shell fails', function (t) {
  common.npm(['run-script', 'shell', '--shell', 'nosuchshell'], {
    cwd: pkg,
    env: {
      PATH: PATH,
      stdio: [0, 'pipe', 2]
    }
  }, function (er, code, stdout) {
    if (er) throw er
    t.equal(code, 1, 'exit code')
    t.end()
  })
})

test('make sure the shell is correct', function (t) {
  common.npm(['run-script', 'shell', '--shell', testShFileName], {
    cwd: pkg,
    env: {
      PATH: PATH,
      stdio: [ 0, 'pipe', 2 ]
    }
  }, function (er, code, stdout) {
    if (er) throw er
    t.equal(code, 0, 'exit code')
    var actual = stdout.trim().split(/\r|\n/).pop()
    var expected = '-c ok'
    t.equal(actual, expected)
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
