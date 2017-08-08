'use strict'

const test = require('tap').test
const lifecycle = require('../index.js')

test('makeEnv', function (t) {
  const pkg = {
    name: 'myPackage',
    version: '1.0.0',
    contributors: [{ name: 'Mike Sherov', email: 'beep@boop.com' }]
  }
  const config = {
    enteente: Infinity,
    '_privateVar': 1,
    '_myPackage:myPrivateVar': 1,
    'myPackage:bar': 2,
    'myPackage:foo': 3,
    'myPackage@1.0.0:baz': 4,
    'myPackage@1.0.0:foo': 5
  }

  const env = lifecycle.makeEnv(pkg, { config }, null, process.env)

  t.equal('myPackage', env.npm_package_name, 'package data is included')
  t.equal('Mike Sherov', env.npm_package_contributors_0_name, 'nested package data is included')

  t.equal('Infinity', env.npm_config_enteente, 'public config is included')
  t.equal(undefined, env.npm_config_privateVar, 'private config is excluded')

  t.equal('1', env.npm_config_myPackage_myPrivateVar, 'private package config is included by name')
  t.equal('2', env.npm_config_myPackage_bar, 'public package config is included by name')

  t.equal('5', env.npm_config_myPackage_1_0_0_foo, 'public package@version config is included by name')

  t.equal('1', env.npm_package_config_myPrivateVar, 'package private config is included')
  t.equal('2', env.npm_package_config_bar, 'package config is included')
  t.equal('4', env.npm_package_config_baz, 'package@version config is included')
  t.equal('5', env.npm_package_config_foo, 'package@version config overrides package config')
  t.end()
})

test('_incorrectWorkingDirectory: accepts wd for package that matches project\'s name', function (t) {
  const wd = '/opt/my-time/node_modules/time'
  const pkg = {name: 'time'}

  t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), false)
  t.end()
})

test('_incorrectWorkingDirectory: accepts wd for package that doesn\'t match project\'s name', function (t) {
  const wd = '/opt/my-project/node_modules/time'
  const pkg = {name: 'time'}

  t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), false)
  t.end()
})

test('_incorrectWorkingDirectory: rejects wd from other packages', function (t) {
  const wd = '/opt/my-time/node_modules/time/invalid'
  const pkg = {
    name: 'time'
  }

  t.equal(lifecycle._incorrectWorkingDirectory(wd, pkg), true)
  t.end()
})
