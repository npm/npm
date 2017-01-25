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

test('lifecycle: make env with arrays', function (t) {
  var services = ['overlord', 'job-1', 'job-2']
  npm.load({}, function () {
    var env = lifecycle.makeEnv({nonconfig: ['Bob', 'John'], config: {services: services}}, null, process.env)

    t.notOk(env.npm_package_nonconfig)
    t.equal(env.npm_package_config_services, services.toString())
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
