var common = require('../common-tap')
  , test = require('tap').test
  , path = require('path')
  , spawn = require('child_process').spawn
  , rimraf = require('rimraf')
  , mkdirp = require('mkdirp')
  , pkg = __dirname + '/startstop'
  , cache = pkg + '/cache'
  , tmp = pkg + '/tmp'
  , node = process.execPath
  , npm = path.resolve(__dirname, '../../cli.js')
  , opts = { cwd: pkg }

function testOutput (t, c, e, code, o) {
  if (e)
    throw new Error('npm ' + command + ' stderr: ' + e.toString())

  c = c.trim().split('\n')
  c = c[c.length - 1]
  t.equal(c, o.cmd[1])
  t.end()
}

function cleanup () {
  rimraf.sync(pkg + '/cache')
  rimraf.sync(pkg + '/tmp')
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg + '/cache')
  mkdirp.sync(pkg + '/tmp')
  t.end()
})

test('npm start', function (t) {
  common.run([npm, 'start'], t, opts, testOutput)
})

test('npm stop', function (t) {
  common.run([npm, 'stop'], t, opts, testOutput)
})

test('npm restart', function (t) {
  common.run([npm, 'restart'], t, opts, function (t, c, e) {
    if (e)
      throw new Error('npm ' + command + ' stderr: ' + e.toString())

    var output = c.split('\n').filter(function (val) {
      return val.match(/^s/)
    })

    t.same(output.sort(), ['start', 'stop'].sort())
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
