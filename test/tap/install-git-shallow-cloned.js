var fs = require('fs')
var crypto = require('crypto')
var path = require('path')
var resolve = path.resolve
var osenv = require('osenv')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var test = require('tap').test
var npm = require('../../lib/npm')
var common = require('../common-tap')
var chain = require('slide').chain

var pkgPath = resolve(__dirname, 'install-shallow-git')
var repoPath = resolve(pkgPath, 'gitrepo')

var git
var gitDaemon
var gitDaemonPID
var gitVersion

test('setup', function (t) {
  setup(function (err, result) {
    t.ifError(err, 'git started up successfully')

    if (!err) {
      gitDaemon = result[result.length - 2]
      gitDaemonPID = result[result.length - 1]
    }

    t.end()
  })
})

test('shallow clone of git repository', function (t) {
  if (/git version [01]\.[0-8]\./.test(gitVersion)) {
    console.log('    ok # skip git <1.9 has bad shallow clone support')
    t.end()
    return
  }
  // Prepare the git repo with a big file removed in the latest commit
  prepareRepoAndGetRefs(function (refs) {
    // Install and shallow fetch repo
    npm.config.set('git-shallow-clone', true)
    npm.commands.install(['git://localhost:1234/gitrepo'], function (err) {
      t.ifError(err, 'npm install successful')
      var cacheSize = getTotalSize(common.npm_config_cache)
      t.ok(cacheSize > 1024 * 10, 'Git repo size bigger than 10KB')
      t.ok(cacheSize < 1024 * 512, 'Git repo size less than 512KB')
      // Install with a SHA as ref, causing us to fetch full repo
      npm.commands.install(['git://localhost:1234/gitrepo#' + refs[1]], function (err) {
        t.ifError(err, 'npm install update successful')
        cacheSize = getTotalSize(common.npm_config_cache)
        t.ok(cacheSize > 1024 * 512, 'Git repo size bigger than 512KB')
        t.ok(cacheSize < 20 * 1024 * 1024, 'Git repo size less than 20MB')
        t.end()
      })
    })
  })
})

test('clean', function (t) {
  gitDaemon.on('close', function () {
    cleanup()
    t.end()
  })
  process.kill(gitDaemonPID)
})

function setup (cb) {
  mkdirp.sync(repoPath)
  // Dummy project only to leave npm package.json alone
  process.chdir(pkgPath)
  fs.writeFileSync(resolve(pkgPath, 'package.json'), JSON.stringify({
    name: 'dummy',
    version: '0.0.1'
  }))
  // Setup gitrepo package
  fs.writeFileSync(resolve(repoPath, 'package.json'), JSON.stringify({
    name: 'gitrepo',
    version: '0.0.1'
  }))
  // Setup npm and then git
  npm.load({
    registry: common.registry,
    loglevel: 'silent',
    save: true // Always install packages with --save
  }, function () {
    // It's important to initialize git after npm because it uses config
    initializeGit(cb)
  })
}

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkgPath)
  rimraf.sync(common['npm_config_cache'])
}

function prepareRepoAndGetRefs (cb) {
  var opts = { cwd: repoPath, env: { PATH: process.env.PATH } }
  chain([
    [fs.writeFile, path.join(repoPath, 'BIGFILE'), crypto.randomBytes(1024 * 1024)],
    git.chainableExec(['add', 'BIGFILE'], opts),
    git.chainableExec(['commit', '-m', 'Add BIGFILE'], opts),
    git.chainableExec(['rm', 'BIGFILE'], opts),
    git.chainableExec(['commit', '-m', 'Remove BIGFILE'], opts),
    git.chainableExec(['log', '--pretty=format:"%H"', '-2'], opts)
  ], function () {
    var gitLogStdout = arguments[arguments.length - 1]
    var refs = gitLogStdout[gitLogStdout.length - 1].split('\n').map(function (ref) {
      return ref.match(/^"(.+)"$/)[1]
    })
    cb(refs)
  })
}

function initializeGit (cb) {
  git = require('../../lib/utils/git')
  git.whichAndExec(['--version'], {}, function (err, result) {
    gitVersion = result
    if (err) {
      cb(err)
      return
    }
    common.makeGitRepo({
      path: repoPath,
      commands: [startGitDaemon]
    }, cb)
  })
}

function startGitDaemon (cb) {
  var daemon = git.spawn(
    [
      'daemon',
      '--verbose',
      '--listen=localhost',
      '--export-all',
      '--base-path=' + pkgPath, // Path to the dir that contains the repo
      '--reuseaddr',
      '--port=1234'
    ],
    {
      cwd: repoPath,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    }
  )
  daemon.stderr.on('data', function findChild (c) {
    var cpid = c.toString().match(/^\[(\d+)\]/)
    if (cpid[1]) {
      this.removeListener('data', findChild)
      cb(null, [daemon, cpid[1]])
    }
  })
}

function getTotalSize (filePath) {
  var stat = fs.lstatSync(filePath)
  var size = stat.size
  if (stat.isDirectory()) {
    var entries = fs.readdirSync(filePath)
    for (var i = 0; i < entries.length; i++) {
      size += getTotalSize(path.join(filePath, entries[i]))
    }
  }
  return size
}
