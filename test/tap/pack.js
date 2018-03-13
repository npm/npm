'use strict'

const BB = require('bluebird')

const test = require('tap').test
const common = require('../common-tap')
const fs = BB.promisifyAll(require('graceful-fs'))
const path = require('path')
const mkdirp = BB.promisify(require('mkdirp'))
const rimraf = BB.promisify(require('rimraf'))

const testDir = path.join(__dirname, 'pkg')
const tmp = path.join(testDir, 'tmp')
const cache = path.join(testDir, 'cache')

const data = {
  name: 'generic-package',
  version: '90000.100001.5'
}

function setup (dir) {
  return rimraf(dir)
  .then(() => mkdirp(dir))
  .then(() => fs.writeFileAsync(
    path.join(dir, 'package.json'),
    JSON.stringify(data, null, 2))
  )
}

test('basic pack', (t) => {
  return setup(testDir)
  .then(() => common.npm([
    'pack',
    '--loglevel', 'notice',
    '--cache', cache,
    '--tmp', tmp,
    '--prefix', testDir,
    '--no-global'
  ], {
    cwd: testDir
  }))
  .spread((code, stdout, stderr) => {
    t.equal(code, 0, 'npm pack exited ok')
    t.match(stderr, /notice\s+\d+[a-z]+\s+package\.json/gi, 'mentions package.json')
    t.match(stdout, /generic-package-90000\.100001\.5\.tgz/ig, 'found pkg')
    return fs.statAsync(
      path.join(testDir, 'generic-package-90000.100001.5.tgz')
    )
  })
  .then((stat) => t.ok(stat, 'tarball written to cwd'))
  .then(() => cleanup(testDir))
})

test('pack --dry-run', (t) => {
  return setup(testDir)
  .then(() => common.npm([
    'pack',
    '--dry-run',
    '--loglevel', 'notice',
    '--cache', cache,
    '--tmp', tmp,
    '--prefix', testDir,
    '--no-global'
  ], {
    cwd: testDir
  }))
  .spread((code, stdout, stderr) => {
    t.equal(code, 0, 'npm pack exited ok')
    t.match(stdout, /generic-package-90000\.100001\.5\.tgz/ig, 'found pkg')
    return fs.statAsync(
      path.join(testDir, 'generic-package-90000.100001.5.tgz')
    )
    .then(
      () => { throw new Error('should have failed') },
      (err) => t.equal(err.code, 'ENOENT', 'no tarball written!')
    )
  })
  .then(() => cleanup(testDir))
})

test('pack --json', (t) => {
  return setup(testDir)
  .then(() => common.npm([
    'pack',
    '--dry-run',
    '--json',
    '--loglevel', 'notice',
    '--cache', cache,
    '--tmp', tmp,
    '--prefix', testDir,
    '--no-global'
  ], {
    cwd: testDir
  }))
  .spread((code, stdout, stderr) => {
    t.equal(code, 0, 'npm pack exited ok')
    t.equal(stderr.trim(), '', 'no notice output')
    t.similar(JSON.parse(stdout), [{
      filename: 'generic-package-90000.100001.5.tgz',
      files: [{path: 'package.json'}],
      entryCount: 1
    }], 'pack details output as valid json')
  })
  .then(() => cleanup(testDir))
})
function cleanup (dir) {
  return rimraf(dir)
}
