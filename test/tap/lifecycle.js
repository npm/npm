var test = require('tap').test
var npm = require('../../')
var lifecycle = require('../../lib/utils/lifecycle')

test('lifecycle: make env correctly', function (t) {
  npm.load({enteente: Infinity}, function () {
    var env = lifecycle.makeEnv({}, null, process.env)

    t.equal('Infinity', env.npm_config_enteente)
    t.end()
  })
})

test('lifecycle : accepts wd for package that matches project\'s name', function (t) {
  npm.load({}, function () {
    var wd = '/opt/my-time/node_modules/time'
    var pkg = {name: 'time'}

    t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), false)
    t.end()
  })
})

test('lifecycle : accepts wd for package that doesn\'t match project\'s name', function (t) {
  npm.load({}, function () {
    var wd = '/opt/my-project/node_modules/time'
    var pkg = {name: 'time'}

    t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), false)
    t.end()
  })
})

test('lifecycle : rejects wd for ', function (t) {
  npm.load({}, function () {
    var wd = '/opt/my-time/node_modules/time/invalid'
    var pkg = {
      name: 'time'
    }

    t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), true)
    t.end()
  })
})

test('lifecycle : accepts TMPDIR that is writable', function (t) {
  var wd = '/opt/my-time/node_modules/time'

  lifecycle._getTemporaryDirectory(wd, process.env, function (er, tmpdir) {
    t.equal(tmpdir, process.env.TMPDIR)
    t.end()
  })
})

test('lifecycle : uses wd if TMPDIR is not writable', function (t) {
  var wd = process.cwd()

  lifecycle._getTemporaryDirectory(wd, {TMPDIR: '/probably/not/writable'}, function (er, tmpdir) {
    t.equal(tmpdir, wd)
    t.end()
  })
})

test('lifecycle : errors if neither TMPDIR or wd are writable', function (t) {
  var wd = '/probably/not/writable/either'

  lifecycle._getTemporaryDirectory(wd, {TMPDIR: '/probably/not/writable'}, function (er, tmpdir) {
    t.ok(er, 'non-writable-directories tmpdir should produce an error')
    t.end()
  })
})
