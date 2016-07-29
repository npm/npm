'use strict'
var test = require('tap').test
var common = require('../common-tap.js')
var path = require('path')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var execSync = require('child_process').execSync
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var npm = require('../../lib/npm.js')
var basepath = path.resolve(__dirname, path.basename(__filename, '.js'))
var gitpath = path.resolve(basepath, 'node-glob.git')
var fixturepath = path.resolve(basepath, 'npm-test-bundled-git')
var modulepath = path.resolve(basepath, 'node_modules')
var installedpath = path.resolve(modulepath, 'npm-test-bundled-git')

var git
var gitDaemon
var gitPid
var gitPort=1235

var minimatchExpected = {
  name: 'minimatch',
  version: '0.2.1',
  main: 'minimatch.js',
  dependencies: {
    'lru-cache': '~1.0.5'
  }
}

var fixture = new Tacks(
  Dir({
    README: File(
      'just an npm test\n'
    ),
    'package.json': File({
      name: 'npm-test-bundled-git',
      scripts: {
        test: 'node test.js'
      },
      version: '1.2.5',
      dependencies: {
        glob: 'git://localhost:' + gitPort + '/#npm-test'
      },
      bundledDependencies: [
        'glob'
      ]
    })
  })
)

var gitFixture = new Tacks(
  Dir({
    '.gitignore': File(
      '.*.swp\n' +
      'test/a/\n'
    ),
    'glob.js': File(),
    node_modules: Dir({
      minimatch: Dir({
        'minimatch.js': File(),
        node_modules: Dir({
          'lru-cache': Dir({
            lib: Dir({
              'lru-cache.js': File(),
            }),
            'package.json': File({
              name: 'lru-cache',
              description: 'A cache object that deletes the least-recently-used items.',
              version: '1.0.5',
              main: 'lib/lru-cache.js',
            })
          })
        }),
        'package.json': File({
          name: 'minimatch',
          version: '0.2.1',
          main: 'minimatch.js',
          dependencies: {
            'lru-cache': '~1.0.5'
          }
        })
      })
    }),
    'package.json': File({
      name: 'glob',
      version: '3.1.5',
      main: 'glob.js',
      dependencies: {
        minimatch: '0.2',
        underscore: '~1.3.1',
        wordwrap: '0'
      },
      devDependencies: {
        optimist: '~0.6.0',
        mkdirp: '0',
        clean: '2'
      },
      bundleDependencies: [
        'minimatch'
      ]
    })
  })
)


test('setup', function (t) {
  npm.load({ prefix: basepath, registry: common.registry, loglevel: 'silent' }, function () {
    git = require('../../lib/utils/git.js')
    setup()
    // start git server
    gitDaemon = git.spawn(
      [
        'daemon',
        '--verbose',
        '--listen=localhost',
        '--export-all',
        '--base-path=.',
        '--reuseaddr',
        '--port=' + gitPort
      ],
      {
        cwd: gitpath,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    gitDaemon.stderr.on('data', childFinder)

    function childFinder (c) {
      var cpid = c.toString().match(/^\[(\d+)\]/)
      if (cpid[1]) {
        this.removeListener('data', childFinder)
        gitPid = cpid[1]
        t.done()
      }
    }
  })
})

test('bundled-git', function (t) {
  common.npm(['install', '--fetch-retries=0', '--global-style', fixturepath], {cwd: basepath}, installCheckAndTest)
  function installCheckAndTest (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'install went ok')

    var actual = require(path.resolve(installedpath, 'node_modules/glob/node_modules/minimatch/package.json'))
    Object.keys(minimatchExpected).forEach(function (key) {
      t.isDeeply(actual[key], minimatchExpected[key], key + ' set to the right value')
    })

    common.npm(['rm', fixturepath], {cwd: basepath}, removeCheckAndDone)
  }
  function removeCheckAndDone (err, code, stdout, stderr) {
    if (err) throw err
    t.is(code, 0, 'remove went ok')
    t.done()
  }
})

test('cleanup', function (t) {
  cleanup()
  gitDaemon.on('close', function () {
    cleanup()
    t.done()
  })
  process.kill(gitPid)
})

function setup () {
  cleanup()
  fixture.create(fixturepath)
  mkdirp.sync(modulepath)
  createGitFixture()
}

function cleanup () {
  fixture.remove(fixturepath)
  rimraf.sync(basepath)
}

function createGitFixture () {
  gitFixture.create(gitpath)
  git.whichAndExecSync(['init'], {cwd: gitpath})
  git.whichAndExecSync(['add','.'], {cwd: gitpath})
  git.whichAndExecSync(['commit', '-minitial'], {cwd: gitpath})
  git.whichAndExecSync(['checkout', '-b', 'npm-test'], {cwd: gitpath})
}
