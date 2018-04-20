/* eslint-disable standard/no-callback-literal */
var test = require('tap').test
var requireInject = require('require-inject')

var npm = require('../../lib/npm.js')

test('npm init <pkg-name>', function (t) {
  var initJsonMock = function () {
    t.ok(false, 'should not run initJson()')
  }
  initJsonMock.yes = function () {
    t.ok(false, 'should not run initJson.yes()')
    return false
  }
  var libnpxMock = function () {
    return Promise.resolve()
  }
  libnpxMock.parseArgs = function (argv, defaultNpm) {
    t.ok(argv[0].includes('node'), 'node is the first arg')
    t.equals(argv[2], '--always-spawn', 'set npx opts.alwaysSpawn')
    t.equals(argv[3], 'create-pkg-name', 'expands pkg-name')
    t.ok(defaultNpm.endsWith('npm-cli.js'), 'passes npx bin path')
  }

  npm.load({ loglevel: 'silent' }, function () {
    var init = requireInject('../../lib/init', {
      'init-package-json': initJsonMock,
      'libnpx': libnpxMock
    })

    init(['pkg-name'], function () {})

    t.end()
  })
})

test('npm init with scoped packages', function (t) {
  var libnpxMock = function () {
    return Promise.resolve()
  }

  npm.load({ loglevel: 'silent' }, function () {
    var init = requireInject('../../lib/init', {
      'libnpx': libnpxMock
    })

    libnpxMock.parseArgs = function (argv) {
      t.equals(argv[3], '@scope/create', 'expands @scope')
    }

    init(['@scope'], function () {})

    libnpxMock.parseArgs = function (argv) {
      t.equals(argv[3], '@scope/create-pkg-name', 'expands @scope/pkg-name')
    }

    init(['@scope/pkg-name'], function () {})

    t.end()
  })
})

test('npm init forwards arguments', function (t) {
  var libnpxMock = function () {
    return Promise.resolve()
  }

  npm.load({ loglevel: 'silent' }, function () {
    var origArgv = process.argv
    var init = requireInject('../../lib/init', {
      'libnpx': libnpxMock
    })

    libnpxMock.parseArgs = function (argv) {
      process.argv = origArgv
      t.same(argv.slice(4), ['a', 'b', 'c'])
    }
    process.argv = [
      process.argv0,
      'NPM_CLI_PATH',
      'init',
      'pkg-name',
      'a', 'b', 'c'
    ]

    init(['pkg-name'], function () {})

    t.end()
  })
})
