'use strict'

var mr = require('npm-registry-mock')

var test = require('tap').test
var common = require('../common-tap.js')

var server

test('setup', function (t) {
  mr({port: common.port}, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s
    t.end()
  })
})

const names = ['add', 'set']
const roles = ['developer', 'admin', 'owner']

names.forEach(function (name) {
  test('org ' + name + ' [orgname] [username]: defaults to developer', function (t) {
    const membershipData = {
      org: {
        name: 'myorg',
        size: 1
      },
      user: 'myuser',
      role: 'developer'
    }
    server.put('/-/org/myorg/user', JSON.stringify({
      user: 'myuser'
    })).reply(200, membershipData)
    common.npm([
      'org', 'add', 'myorg', 'myuser',
      '--registry', common.registry,
      '--loglevel', 'silent'
    ], {}, function (err, code, stdout, stderr) {
      t.ifError(err, 'npm org')

      t.equal(code, 0, 'exited OK')
      t.equal(stderr, '', 'no error output')

      t.same(JSON.parse(stdout), membershipData)
      t.end()
    })
  })

  roles.forEach(function (role) {
    test('org ' + name + ' [orgname] [username]: accepts role ' + role, function (t) {
      const membershipData = {
        org: {
          name: 'myorg',
          size: 1
        },
        user: 'myuser',
        role: role
      }
      server.put('/-/org/myorg/user', JSON.stringify({
        user: 'myuser'
      })).reply(200, membershipData)
      common.npm([
        'org', name, 'myorg', 'myuser',
        '--registry', common.registry,
        '--loglevel', 'silent'
      ], {}, function (err, code, stdout, stderr) {
        t.ifError(err, 'npm org')

        t.equal(code, 0, 'exited OK')
        t.equal(stderr, '', 'no error output')

        t.same(JSON.parse(stdout), membershipData)
        t.end()
      })
    })
  })
})

test('org rm [orgname] [username]', function (t) {
  const membershipData = {
    org: {
      name: 'myorg',
      size: 1
    },
    user: 'myuser'
  }
  server.delete('/-/org/myorg/user', JSON.stringify({
    user: 'myuser'
  })).reply(204, membershipData)
  common.npm([
    'org', 'rm', 'myorg', 'myuser',
    '--registry', common.registry,
    '--loglevel', 'silent'
  ], {}, function (err, code, stdout, stderr) {
    t.ifError(err, 'npm org')

    t.equal(code, 0, 'exited OK')
    t.equal(stderr, '', 'no error output')
    t.equal(stdout, '', 'no output')
    t.end()
  })
})

test('org ls [orgname]', function (t) {
  const membershipData = {
    username: 'admin',
    username2: 'foo'
  }
  server.get('/-/org/myorg/user')
    .reply(200, membershipData)
  common.npm([
    'org', 'ls', 'myorg',
    '--registry', common.registry,
    '--loglevel', 'silent'
  ], {}, function (err, code, stdout, stderr) {
    t.ifError(err, 'npm org')
    t.equal(code, 0, 'exited OK')
    t.equal(stderr, '', 'no error output')
    t.same(JSON.parse(stdout), membershipData, 'outputs members')
    t.end()
  })
})

test('cleanup', function (t) {
  t.pass('cleaned up')
  server.done()
  server.close()
  t.end()
})

