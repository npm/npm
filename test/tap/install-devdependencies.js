var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var readJson = require('read-package-json')
var osenv = require('osenv')

var pkg = path.join(__dirname, 'install-devdependencies')
var depJson = path.resolve(pkg, 'node_modules', 'checker', 'package.json')
var regOpts = {
  port: common.port
}
var npmOpts = {
  registry: common.registry,
  prefix: pkg,
  cache: path.resolve(pkg, 'cache')
}

var server

function resetPackage (opts) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  mkdirp.sync(pkg)
  process.chdir(pkg)

  rimraf.sync('node_modules')
  mkdirp.sync('cache')

  var p = {}

  for (var key in opts) {
    p[key] = { 'checker': opts[key] }
  }

  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n', 'utf8')
}

test('setup', function (t) {
  mr(regOpts, function (err, s) {
    server = s
    t.ifError(err, 'server started ok')
    t.end()
  })
})

test('npm install checker should install 0.5.1 if specified in `devDependencies`', function (t) {
  resetPackage({ 'devDependencies': '0.5.1' })

  npm.load(npmOpts, function (err) {
    t.ifError(err, 'npm loaded ok')
    npm.commands.install(['checker'], function (err) {
      t.ifError(err, 'no error on install')
      readJson(depJson, function (err, data) {
        t.ifError(err, 'no error reading installed package.json')
        t.deepEqual(data.version, '0.5.1')
        t.end()
      })
    })
  })
})

test('cleanup', function (t) {
  server.close()

  process.chdir(__dirname)
  rimraf.sync(pkg)
  t.end()
})
