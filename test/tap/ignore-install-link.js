var common = require('../common-tap.js')
var test = require('tap').test
var osenv = require('osenv')
var npm = require('../..')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.resolve(__dirname, 'ignore-install-link')
var spawn = require('child_process').spawn
var linkDir = path.resolve(osenv.tmpdir(), 'npm-link-issue')

test('ignore-install-link: ignore install if a package is linked', function(t) {
  setup(t, function() {
    var p = path.resolve(pkg, 'node_modules', 'npm-link-issue')
    fs.lstat(p, function(err, s) {
      if (err) t.ok(err === null)
      t.pass('child is a symlink')
      t.ok(true === s.isSymbolicLink())
      t.end()
    })
  })
})

test('cleanup', function(t) {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
  rimraf.sync(linkDir)
  t.end()
})


function setup(t, cb) {
  rimraf.sync(linkDir)
  mkdirp.sync(pkg)
  mkdirp.sync(path.resolve(pkg, 'cache'))
  mkdirp.sync(path.resolve(pkg, 'node_modules'))
  mkdirp.sync(linkDir)
  fs.writeFileSync(path.resolve(pkg, 'package.json'), JSON.stringify({
    author: 'Evan Lucas',
    name: 'ignore-install-link',
    version: '0.0.0',
    description: 'Test for ignoring install when a package has been linked',
    dependencies: {
      'npm-link-issue': 'git+https://github.com/lancefisher/npm-link-issue.git#0.0.1'
    }
  }), 'utf8')
  fs.writeFileSync(path.resolve(linkDir, 'package.json'), JSON.stringify({
    author: 'lancefisher',
    name: 'npm-link-issue',
    version: '0.0.1',
    description: 'Sample Dependency'
  }), 'utf8')
  clone(t, cb)
}

function clone(t, cb) {
  var child = spawn('git', ['--git-dir', linkDir, 'init'])
//  var child = spawn('git', ['clone', 'https://github.com/lancefisher/npm-link-issue.git', linkDir])
  child.on('exit', function(c) {
    if (c !== 0) t.fail('unable to clone repository')
    t.pass('successfully cloned repo')
    process.chdir(linkDir)
    performLink(t, cb)
  })
}

function performLink(t, cb) {
  var child = createChild(linkDir, 'npm', ['link', '.'])
  child.on('close', function() {
    t.pass('successfully linked '+linkDir+' globally')
    performLink2(t, cb)
  })
}

function performLink2(t, cb) {
  var child = createChild (pkg, 'npm', ['link', 'npm-link-issue'])
  child.on('close', function() {
    t.pass('successfully linked '+linkDir+' to local node_modules')
    performInstall(t, cb)
  })
}

function performInstall(t, cb) {
  var child = createChild (pkg, 'npm', ['install'])
  child.on('close', function() {
    t.pass('successfully installed')
    cb()
  })
}

function createChild (cwd, cmd, args) {
  var env = {
    HOME: process.env.HOME,
    Path: process.env.PATH,
    PATH: process.env.PATH
  }

  if (process.platform === "win32")
    env.npm_config_cache = "%APPDATA%\\npm-cache"

  return spawn(cmd, args, {
    cwd: cwd,
    stdio: "inherit",
    env: env
  })
}
