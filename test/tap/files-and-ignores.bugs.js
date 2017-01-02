'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var fs = require('graceful-fs')
var tar = require('tar')
var zlib = require('zlib')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var fixturepath = path.resolve(basepath, 'npm-test-files')
var targetpath = path.resolve(basepath, 'target')
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir

test('README files shouldn`t be ignored with .npmignore', function (t) {
  var fixture = new Tacks(
    Dir({
      'package.json': File({
        name: 'npm-test-files',
        version: '1.2.5'
      }),
      '.npmignore': File(
        'README',
        'Readme',
        'readme',
        'readme.md',
        'Readme.md',
        'README.md',
        'readme.en.md',
        'Readme.en.md',
        'README.en.md'
      ),
      'README': File(''),
      'Readme': File(''),
      'readme': File(''),
      'readme.md': File(''),
      'Readme.md': File(''),
      'README.md': File(''),
      'readme.en.md': File(''),
      'Readme.en.md': File(''),
      'README.en.md': File('')
    })
  )
  withFixture(t, fixture, function (done) {
    t.ok(fileExists('README'), 'README included')
    t.ok(fileExists('Readme'), 'Readme included')
    t.ok(fileExists('readme'), 'readme included')
    t.ok(fileExists('readme.md'), 'readme.md included')
    t.ok(fileExists('Readme.md'), 'Readme.md included')
    t.ok(fileExists('README.md'), 'README.md included')
    t.ok(fileExists('readme.en.md'), 'readme.en.md included')
    t.ok(fileExists('Readme.en.md'), 'Readme.en.md included')
    t.ok(fileExists('README.en.md'), 'README.en.md included')
    done()
  })
})

test('All README variants should always be included with `files` directive in package.json', function (t) {
  var fixture = new Tacks(
    Dir({
      'package.json': File({
        name: 'npm-test-files',
        version: '1.2.5',
        files: []
      }),
      'README': File(''),
      'Readme': File(''),
      'readme': File(''),
      'readme.md': File(''),
      'Readme.md': File(''),
      'README.md': File(''),
      'readme.en.md': File(''),
      'Readme.en.md': File(''),
      'README.en.md': File('')
    })
  )
  withFixture(t, fixture, function (done) {
    t.ok(fileExists('README'), 'README included')
    t.ok(fileExists('Readme'), 'Readme included')
    t.ok(fileExists('readme'), 'readme included')
    t.ok(fileExists('readme.md'), 'readme.md included')
    t.ok(fileExists('Readme.md'), 'Readme.md included')
    t.ok(fileExists('README.md'), 'README.md included')
    t.ok(fileExists('readme.en.md'), 'readme.en.md included')
    t.ok(fileExists('Readme.en.md'), 'Readme.en.md included')
    t.ok(fileExists('README.en.md'), 'README.en.md included')
    done()
  })
})

test('.npmignore should exclude files when it contains any of `unconditionally` included files', function (t) {
  var fixture = new Tacks(
    Dir({
      'package.json': File({
        name: 'npm-test-files',
        version: '1.2.5'
      }),
      '.npmignore': File(
        'LICENCE.md',
        'WTF'
      ),
      'WTF': File('')
    })
  )
  withFixture(t, fixture, function (done) {
    t.notOk(fileExists('WTF'), 'toplevel file excluded')
    done()
  })
})

function fileExists (file) {
  try {
    return !!fs.statSync(path.resolve(targetpath, 'package', file))
  } catch (_) {
    return false
  }
}

function withFixture (t, fixture, tester) {
  fixture.create(fixturepath)
  mkdirp.sync(targetpath)
  common.npm(['pack', fixturepath], {cwd: basepath}, extractAndCheck)
  function extractAndCheck (err, code) {
    if (err) throw err
    t.is(code, 0, 'pack went ok')
    extractTarball(checkTests)
  }
  function checkTests (err) {
    if (err) throw err
    tester(removeAndDone)
  }
  function removeAndDone (err) {
    if (err) throw err
    fixture.remove(fixturepath)
    rimraf.sync(basepath)
    t.done()
  }
}

function extractTarball (cb) {
  // Unpack to disk so case-insensitive filesystems are consistent
  fs.createReadStream(path.join(basepath, 'npm-test-files-1.2.5.tgz'))
    .pipe(zlib.Unzip())
    .on('error', cb)
    .pipe(tar.Extract(targetpath))
    .on('error', cb)
    .on('end', function () { cb() })
}
