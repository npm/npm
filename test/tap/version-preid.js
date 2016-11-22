var common = require('../common-tap.js')
var test = require('tap').test
var osenv = require('osenv')
var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var pkg = path.resolve(__dirname, 'version-preid')

test('npm version <semver> in a git repo with --preid', function (t) {
  setup()
  common.npm(
    ['version', 'prepatch', '--preid', 'beta'],
    {
      cwd: pkg,
      env: {}
    },
    function (error, code, stdout, stderr) {
      if (!t.error(error)) return t.end()
      var p = path.resolve(pkg, 'package')
      var testPkg = require(p)
      t.equal(String(stderr).trim(), '', 'String(stderr) === \'\'')
      t.equal(String(stdout).trim(), 'v1.0.1-beta.0', 'String(stdout) === \'v1.0.1-beta.0\'')
      t.equal(testPkg.version, '1.0.1-beta.0', '\'' + testPkg.version + '\' === \'1.0.1-beta.0\'')
      t.end()
    }
  )
})

test('cleanup', function (t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  t.end()
})

function setup () {
  mkdirp.sync(pkg)
  fs.writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify({
    name: 'version-preid-test',
    version: '1.0.0',
    description: 'Test for --preid option'
  }), 'utf8')
  process.chdir(pkg)
}
