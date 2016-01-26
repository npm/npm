'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-shrinkwrap')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-shrinkwrap')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'npm-shrinkwrap.json': File({
      name: 'npm-test-shrinkwrap',
      version: '0.0.0',
      dependencies: {
        glob: {
          version: '3.1.5',
          from: 'git://github.com/isaacs/node-glob.git#npm-test',
          resolved: 'git://github.com/isaacs/node-glob.git#67bda227fd7a559cca5620307c7d30a6732a792f',
          dependencies: {
            'graceful-fs': {
              version: '1.1.5',
              resolved: 'https://registry.npmjs.org/graceful-fs/-/graceful-fs-1.1.5.tgz',
              dependencies: {
                'fast-list': {
                  version: '1.0.2',
                  resolved: 'https://registry.npmjs.org/fast-list/-/fast-list-1.0.2.tgz'
                }
              }
            },
            inherits: {
              version: '1.0.0',
              resolved: 'https://registry.npmjs.org/inherits/-/inherits-1.0.0.tgz'
            },
            minimatch: {
              version: '0.2.1',
              dependencies: {
                'lru-cache': {
                  version: '1.0.5'
                }
              }
            }
          }
        },
        minimatch: {
          version: '0.1.5',
          resolved: 'https://registry.npmjs.org/minimatch/-/minimatch-0.1.5.tgz',
          dependencies: {
            'lru-cache': {
              version: '1.0.5',
              resolved: 'https://registry.npmjs.org/lru-cache/-/lru-cache-1.0.5.tgz'
            }
          }
        },
        'npm-test-single-file': {
          version: '1.2.3',
          resolved: 'https://gist.github.com/isaacs/1837112/raw/9ef57a59fc22aeb1d1ca346b68826dcb638b8416/index.js'
        }
      }
    }),
    'package.json': File({
      author: 'Isaac Z. Schlueter <i@izs.me> (http://blog.izs.me/)',
      name: 'npm-test-shrinkwrap',
      version: '0.0.0',
      dependencies: {
        'npm-test-single-file': 'https://gist.github.com/isaacs/1837112/raw/9ef57a59fc22aeb1d1ca346b68826dcb638b8416/index.js',
        glob: 'git://github.com/isaacs/node-glob.git#npm-test',
        minimatch: '~0.1.0'
      },
      scripts: {
        test: 'node test.js'
      }
    }),
    'test.js': File(
      "var assert = require('assert')\n" +
      '\n' +
      'process.env.npm_config_prefix = process.cwd()\n' +
      'delete process.env.npm_config_global\n' +
      'delete process.env.npm_config_depth\n' +
      '\n' +
      'var npm = process.env.npm_execpath\n' +
      '\n' +
      "require('child_process').execFile(process.execPath, [npm, 'ls', '--json'],\n" +
      "  { stdio: 'pipe', env: process.env, cwd: process.cwd() },\n" +
      '  function (err, stdout, stderr) {\n' +
      '    if (err) throw err\n' +
      '\n' +
      '    var actual = JSON.parse(stdout)\n' +
      "    var expected = require('./npm-shrinkwrap.json')\n" +
      '    rmFrom(actual)\n' +
      '    actual = actual.dependencies\n' +
      '    rmFrom(expected)\n' +
      '    expected = expected.dependencies\n' +
      '    console.error(JSON.stringify(actual, null, 2))\n' +
      '    console.error(JSON.stringify(expected, null, 2))\n' +
      '\n' +
      '    assert.deepEqual(actual, expected)\n' +
      '  }\n' +
      ')\n' +
      '\n' +
      'function rmFrom (obj) {\n' +
      '  for (var i in obj) {\n' +
      "    if (i === 'from') {\n" +
      '      delete obj[i]\n' +
      "    } else if (i === 'dependencies') {\n" +
      '      for (var j in obj[i]) {\n' +
      '        rmFrom(obj[i][j])\n' +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}\n'
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('shrinkwrap', function (t) {
  common.npm(['install', fixturepath], {cwd: basepath}, installCheckAndTest)
  function installCheckAndTest (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'install went ok')
    common.npm(['test'], {cwd: installedpath}, testCheckAndRemove)
  }
  function testCheckAndRemove (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'test went ok')
    common.npm(['rm', fixturepath], {cwd: basepath}, removeCheckAndDone)
  }
  function removeCheckAndDone (err, code, stdout, stderr) {
    if (err) throw err
    console.error(stderr)
    console.log(stdout)
    t.is(code, 0, 'remove went ok')
    t.done()
  }
})
test('cleanup', function (t) {
  cleanup()
  t.done()
})
function setup () {
  cleanup()
  fixture.create(fixturepath)
  mkdirp.sync(modulepath)
}
function cleanup () {
  fixture.remove(fixturepath)
  rimraf.sync(basepath)
}
