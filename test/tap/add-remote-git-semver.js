var fs = require('fs')
var resolve = require('path').resolve

var osenv = require('osenv')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var test = require('tap').test

var npm = require('../../lib/npm.js')
var common = require('../common-tap.js')

var pkg = resolve(__dirname, 'add-remote-git-semver')
var pkgDeps = resolve(pkg, 'node_modules')
var repo = resolve(__dirname, 'add-remote-git-semver-repo')

var daemon
var daemonPID
var git

var writeParentPkg = function (commitish) {
  var pjParent = JSON.stringify({
    name: 'parent',
    version: '1.2.3',
    dependencies: {
      child: 'git://localhost:1234/child.git#' + commitish
    }
  }, null, 2) + '\n'
  fs.writeFileSync(resolve(pkg, 'package.json'), pjParent)
}

var pjChildVersions = ['1.0.0', '1.0.1', '1.0.3', '1.1.0', '1.1.5', '2.0.0']
var createChildPkg = function (version) {
  return JSON.stringify({
    name: 'child',
    version: version
  }, null, 2) + '\n'
}

test('setup', function (t) {
  bootstrap()
  setup(function (er, r) {
    t.ifError(er, 'git started up successfully')

    if (!er) {
      daemon = r[r.length - 2]
      daemonPID = r[r.length - 1]
    }

    t.end()
  })
})

test('install exact version tag', function (t) {
  process.chdir(pkg)
  writeParentPkg('v2.0.0')
  npm.commands.install('.', [], function (er, result) {
    t.ifError(er, 'npm installed exact version tag')
    t.equal(result.length, 1)
    t.equal(result[0][0], 'child@2.0.0')

    cleanup(pkgDeps)
    t.end()
  })
})

test('install latest tag', function (t) {
  process.chdir(pkg)
  writeParentPkg('latest')
  npm.commands.install('.', [], function (er, result) {
    t.ifError(er, 'npm installed `latest` tag')
    t.equal(result.length, 1)
    t.equal(result[0][0], 'child@2.0.0')

    cleanup(pkgDeps)
    t.end()
  })
})

test('install semver exact version', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:2.0.0')
  npm.commands.install('.', [], function (er, result) {
    t.ifError(er, 'npm installed exact semver version')
    t.equal(result.length, 1)
    t.equal(result[0][0], 'child@2.0.0')

    cleanup(pkgDeps)
    t.end()
  })
})

test('install semver range ^', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:^1.0.0')
  npm.commands.install('.', [], function (er, result) {
    t.ifError(er, 'npm installed semver range with `^`')
    t.equal(result.length, 1)
    t.equal(result[0][0], 'child@1.1.5')

    cleanup(pkgDeps)
    t.end()
  })
})

test('install semver range ~', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:~1.0.0')
  npm.commands.install('.', [], function (er, result) {
    t.ifError(er, 'npm installed semver range with `~`')
    t.equal(result.length, 1)
    t.equal(result[0][0], 'child@1.0.3')

    cleanup(pkgDeps)
    t.end()
  })
})

test('latest tag is an invalid semver range', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:latest')
  npm.commands.install('.', [], function (er, result) {
    t.equal(er.message, 'latest is not a valid semver range')
    t.equal(result.length, 0)

    cleanup(pkgDeps)
    t.end()
  })
})

test('invalid semver range', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:not-a-valid-range')
  npm.commands.install('.', [], function (er, result) {
    t.equal(er.message, 'not-a-valid-range is not a valid semver range')
    t.equal(result.length, 0)

    cleanup(pkgDeps)
    t.end()
  })
})

test('no satisfying tag found', function (t) {
  process.chdir(pkg)
  writeParentPkg('semver:5.x.x')
  npm.commands.install('.', [], function (er, result) {
    t.equal(er.message, 'unable to find satisfying git tag for semver range: 5.x.x')
    t.equal(result.length, 0)

    cleanup(pkgDeps)
    t.end()
  })
})

test('clean', function (t) {
  daemon.on('close', function () {
    cleanup(repo)
    cleanup(pkg)
    t.end()
  })
  process.kill(daemonPID)
})

function bootstrap () {
  cleanup(repo)
  cleanup(pkg)
  mkdirp.sync(pkg)
}

function setup (cb) {
  mkdirp.sync(repo)
  fs.writeFileSync(resolve(repo, 'package.json'), createChildPkg('0.0.0'))
  npm.load({ registry: common.registry, loglevel: 'silent' }, function () {
    git = require('../../lib/utils/git.js')

    function startDaemon (cb) {
      // start git server
      var d = git.spawn(
        [
          'daemon',
          '--verbose',
          '--listen=localhost',
          '--export-all',
          '--base-path=.',
          '--reuseaddr',
          '--port=1234'
        ],
        {
          cwd: pkg,
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      )
      d.stderr.on('data', childFinder)

      function childFinder (c) {
        var cpid = c.toString().match(/^\[(\d+)\]/)
        if (cpid[1]) {
          this.removeListener('data', childFinder)
          cb(null, [d, cpid[1]])
        }
      }
    }

    var commands = []
    // write package.json files and tag each version
    pjChildVersions.forEach(function (version) {
      commands.push(
        [
          fs, 'writeFile',
          resolve(repo, 'package.json'), createChildPkg(version)
        ],
        git.chainableExec(
          ['add', 'package.json'],
          { cwd: repo, env: process.env }
        ),
        git.chainableExec(
          ['commit', '-m', 'up version to ' + version],
          { cwd: repo, env: process.env }
        ),
        git.chainableExec(
          ['tag', 'v' + version],
          { cwd: repo, env: process.env }
        )
      )
    })

    commands.push(
      // non semver-valid tag should be handled
      git.chainableExec(
        ['tag', 'latest'],
        { cwd: repo, env: process.env }
      ),
      git.chainableExec(
        ['clone', '--bare', repo, 'child.git'],
        { cwd: pkg, env: process.env }
      ),
      startDaemon
    )

    common.makeGitRepo({
      path: repo,
      commands: commands
    }, cb)
  })
}

function cleanup (path) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(path)
}
