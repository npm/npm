var test = require('tap').test
var npm = require.resolve('../../bin/npm-cli.js')
var node = process.execPath
var spawn = require('child_process').spawn

test('npm asdf should return exit code 1', function(t) {
  createChild(process.cwd(), node, [npm, 'asdf',])
    .on('close', function(c) {
      t.equal(c, 1, 'exit code should be 1')
      t.end()
    })
})

test('npm help should return exit code 0', function(t) {
  createChild(process.cwd(), node, [npm, 'help'])
    .on('close', function(c) {
      t.equal(c, 0, 'exit code should be 0')
      t.end()
    })
})

test('npm help fadf should return exit code 0', function(t) {
  createChild (process.cwd(), node, [npm, 'help', 'fadf'])
    .on('close', function(c) {
      t.equal(c, 0, 'exit code should be 0')
      t.end()
    })
})

function createChild (cwd, cmd, args) {
  var env = {
    HOME: process.env.HOME,
    Path: process.env.PATH,
    PATH: process.env.PATH
  }

  if (process.platform === 'win32')
    env.npm_config_cache = '%APPDATA%\\npm-cache'

  return spawn(cmd, args, {
    cwd: cwd,
    stdio: 'inherit',
    env: env
  })
}
