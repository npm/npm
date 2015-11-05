var fs = require('graceful-fs')
var join = require('path').join

var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var test = require('tap').test

var Packer = require('..')

var pkg = join(__dirname, 'test-package')

var elfJS = function () {/*
module.exports = function () {
  console.log("i'm a elf")
}
*/}.toString().split('\n').slice(1, -1).join()

var json = {
  'name': 'test-package',
  'version': '3.1.4',
  'main': 'elf.js'
}

test('setup', function (t) {
  setup()
  t.end()
})

var included = [
  'package.json',
  'elf.js'
]

test('follows npm package ignoring rules', function (t) {
  var subject = new Packer({ path: pkg, type: 'Directory', isDirectory: true })
  var seen = {}
  subject.on('entry', function (entry) {
    t.equal(entry.type, 'File', 'only files in this package')
    var filename = entry.basename
    t.ok(
      included.indexOf(filename) > -1,
      filename + ' is included'
    )
    seen[filename] = true
  })
  // need to do this so fstream doesn't explode when files are removed from
  // under it
  subject.on('end', function () {
    included.forEach(function (filename) {
      t.ok(
        seen[filename],
        filename + ' was not excluded'
      )
    })
    t.end()
  })
})

test('cleanup', function (t) {
  // rimraf.sync chokes here for some reason
  rimraf(pkg, function () { t.end() })
})

function setup () {
  rimraf.sync(pkg)
  mkdirp.sync(pkg)
  fs.writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  fs.writeFileSync(
    join(pkg, 'elf.js'),
    elfJS
  )

  fs.writeFileSync(
    join(pkg, '.npmrc'),
    'packaged=false'
  )

  fs.writeFileSync(
    join(pkg, '.npmignore'),
    '.npmignore\ndummy\npackage.json'
  )

  fs.writeFileSync(
    join(pkg, 'dummy'),
    'foo'
  )

  var buildDir = join(pkg, 'build')
  mkdirp.sync(buildDir)
  fs.writeFileSync(
    join(buildDir, 'config.gypi'),
    "i_wont_be_included_by_fstream='with any luck'"
  )

  fs.writeFileSync(
    join(buildDir, 'npm-debug.log'),
    '0 lol\n'
  )

  var gitDir = join(pkg, '.git')
  mkdirp.sync(gitDir)
  fs.writeFileSync(
    join(gitDir, 'gitstub'),
    "won't fool git, also won't be included by fstream"
  )

  var historyDir = join(pkg, 'node_modules/history')
  mkdirp.sync(historyDir)
  fs.writeFileSync(
    join(historyDir, 'README.md'),
    "please don't include me"
  )
}
