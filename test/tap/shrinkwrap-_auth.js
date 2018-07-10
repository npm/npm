'use strict'

var fs = require('fs')
var path = require('path')
var writeFileSync = require('graceful-fs').writeFileSync

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var http = require('http')
var rimraf = require('rimraf')
var ssri = require('ssri')
var test = require('tap').test

var common = require('../common-tap.js')

var pkg = path.resolve(__dirname, path.basename(__filename, '.js'))
var outfile = path.resolve(pkg, '_npmrc')

var modules = path.resolve(pkg, 'node_modules')
var tarballPath = '/scoped-underscore/-/scoped-underscore-1.3.1.tgz'
var tarballURL = common.registry + tarballPath
var tarball = path.resolve(__dirname, '../fixtures/scoped-underscore-1.3.1.tgz')
var tarballIntegrity = ssri.fromData(fs.readFileSync(tarball)).toString()

var _auth = '0xabad1dea'
var server = http.createServer()
const errors = []
server.on('request', (req, res) => {
  const auth = 'Basic ' + _auth
  if (req.method === 'GET' && req.url === tarballPath) {
    if (req.headers.authorization === auth) {
      res.writeHead(200, 'ok')
      res.end(fs.readFileSync(tarball))
    } else {
      res.writeHead(403, 'unauthorized')
      errors.push("Got authorization of '" + req.headers.authorization + "' expected '" + auth + "'")
      res.end()
    }
  } else {
    res.writeHead(500)
    errors.push('Unknown request: ' + req.method + ' ' + req.url)
    res.end()
  }
})

test('setup', function (t) {
  server.listen(common.port, () => {
    setup()
    t.done()
  })
})

test('authed npm install with shrinkwrapped global package using _auth', function (t) {
  common.npm(
    [
      'install',
      '--loglevel', 'error',
      '--json',
      '--fetch-retries', 0,
      '--registry', common.registry,
      '--userconfig', outfile
    ],
    {cwd: pkg, stdio: [0, 'pipe', 2]},
    function (err, code, stdout) {
      if (err) throw err
      t.equal(code, 0, 'npm install exited OK')
      errors.forEach((err) => t.comment('Error: ' + err))
      try {
        var results = JSON.parse(stdout)
        t.match(results, {added: [{name: '@scoped/underscore', version: '1.3.1'}]}, '@scoped/underscore installed')
      } catch (ex) {
        console.error('#', ex)
        t.ifError(ex, 'stdout was valid JSON')
      }

      t.end()
    }
  )
})

test('cleanup', function (t) {
  server.close(() => {
    cleanup()
    t.end()
  })
})

var contents = '_auth=' + _auth + '\n' +
               '\'always-auth\'=true\n'

var json = {
  name: 'test-package-install',
  version: '1.0.0',
  dependencies: {
    '@scoped/underscore': '1.0.0'
  }
}

var shrinkwrap = {
  name: 'test-package-install',
  version: '1.0.0',
  lockfileVersion: 1,
  dependencies: {
    '@scoped/underscore': {
      resolved: tarballURL,
      integrity: tarballIntegrity,
      version: '1.3.1'
    }
  }
}

function setup () {
  cleanup()
  mkdirp.sync(modules)
  writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify(json, null, 2) + '\n')
  writeFileSync(outfile, contents)
  writeFileSync(
    path.resolve(pkg, 'npm-shrinkwrap.json'),
    JSON.stringify(shrinkwrap, null, 2) + '\n'
  )
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
