var test = require('tap').test
var npm = require.resolve('../../bin/npm-cli.js')
var node = process.execPath
var spawn = require('child_process').spawn
var path = require('path')
var pkg = path.resolve(__dirname, 'lifecycle-signal')

test('lifecycle signal abort', function (t) {
  // windows does not use lifecycle signals, abort
  if (process.platform === 'win32' || process.env.TRAVIS) return t.end()

  var child = spawn(node, [npm, 'install'], {
    cwd: pkg
  })
  child.on('close', function (code, signal) {
    // GNU shell returns a code, no signal
    if (process.platform === 'linux') {
      t.equal(code, 1)
      t.equal(signal, null)
      return t.end()
    }

    t.equal(code, null)
    t.equal(signal, 'SIGSEGV')
    t.end()
  })
})
