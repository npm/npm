'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-ignore')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-ignore')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var fixture = new Tacks(
  Dir({
    '.npmignore': File(
      '/sub/ignore1\n' +
      './sub/include2\n' +
      'ignore3\n' +
      './include4\n' +
      'ignoredir1\n' +
      'ignoredir2/\n' +
      '*.tgz\n'
    ),
    README: File(
      'just an npm test\n'
    ),
    ignore3: File(''),
    ignoredir1: Dir({
      'a': File('')
    }),
    ignoredir2: Dir({
      'a': File('')
    }),
    include4: File(''),
    'package.json': File({
      name: 'npm-test-ignore',
      version: '1.2.5',
      scripts: {
        test: 'bash test.sh'
      }
    }),
    sub: Dir({
      ignore1: File(''),
      ignore3: File(''),
      include: File(''),
      include2: File(''),
      include4: File(
        'This file should be in the package.\n'
      )
    }),
    'test.sh': File(
      'x=`find . | grep ignore | grep -v npmignore`\n' +
      'if [ "$x" != "" ]; then\n' +
      '  echo "ignored files included: $x"\n' +
      '  exit 1\n' +
      'fi\n' +
      '\n' +
      'x=`find . | grep -v ignore | sort`\n' +
      'y=".\n' +
      './include4\n' +
      './package.json\n' +
      './README\n' +
      './sub\n' +
      './sub/include\n' +
      './sub/include2\n' +
      './sub/include4\n' +
      './test.sh"\n' +
      'y="`echo "$y" | sort`"\n' +
      'if [ "$x" != "$y" ]; then\n' +
      '  echo "missing included files"\n' +
      '  echo "got:"\n' +
      '  echo "==="\n' +
      '  echo "$x"\n' +
      '  echo "==="\n' +
      '  echo "wanted:"\n' +
      '  echo "==="\n' +
      '  echo "$y"\n' +
      '  echo "==="\n' +
      '  exit 1\n' +
      'fi\n'
    )
  })
)
test('setup', function (t) {
  setup()
  t.done()
})
test('ignore', function (t) {
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
