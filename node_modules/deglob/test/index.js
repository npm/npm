var path = require('path')
var test = require('tape')
var deglob = require('../')

var playground = path.join(__dirname, 'playground')
var opts = {cwd: playground, gitIgnoreFile: 'custom-gitignore'}

test('all of the things', function (t) {
  globbies.forEach(function (obj) {
    deglob(obj.globs, obj.opts, checkEm)

    function checkEm (err, files) {
      if (err) throw err
      var testName = obj.name + ' -- matches ' + obj.expectedFiles.length + ' files'
      t.equals(files.length, obj.expectedFiles.length, testName)
      obj.expectedFiles.forEach(function (expectedFile) {
        t.ok(files.indexOf(path.join(playground, expectedFile)) > -1, 'File in Result: ' + expectedFile)
      })
    }
  })

  t.end()
})

var globbies = [
  {
    name: '*.txt useGitIgnore: default, usePackageJson: default',
    globs: '*.txt',
    opts: Object.assign({}, opts),
    expectedFiles: ['blah.txt']
  },
  {
    name: '*.txt useGitIgnore: false, usePackageJson: default',
    globs: '*.txt',
    opts: Object.assign({}, opts, {useGitIgnore: false}),
    expectedFiles: [
      'ignored-by-git.txt',
      'blah.txt']
  },
  {
    name: '*.txt useGitIgnore: false, usePackageJson: false',
    globs: '*.txt',
    opts: Object.assign({}, opts, {useGitIgnore: false, usePackageJson: false}),
    expectedFiles: [
      'ignored-by-git.txt',
      'ignored-by-package-json.txt',
      'blah.txt']
  },
  {
    name: '*.txt and *.json useGitIgnore: default, usePackageJson: false',
    globs: ['*.txt', '*.json'],
    opts: Object.assign({}, opts, {usePackageJson: false}),
    expectedFiles: [
      'ignored-by-package-json.txt',
      'blah.txt',
      'package.json']
  },
  {
    name: '*.txt and *.json useGitIgnore: default, usePackageJson: default, configKey: custom-ignore-blah',
    globs: ['*.txt'],
    opts: Object.assign({}, opts, {configKey: 'custom-ignore-blah'}),
    expectedFiles: ['ignored-by-package-json.txt']
  }
]
