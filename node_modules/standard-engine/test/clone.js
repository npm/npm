#!/usr/bin/env node

var crossSpawn = require('cross-spawn')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var test = require('tape')

var GIT = 'git'
var STANDARD = path.join(__dirname, 'lib', 'standard-cmd.js')
var TMP = path.join(__dirname, '..', 'tmp')

const pkg = {
  name: 'standard',
  repo: 'https://github.com/feross/standard'
}

test('test `standard` repo', function (t) {
  t.plan(1)

  mkdirp.sync(TMP)

  var name = pkg.name
  var url = pkg.repo + '.git'
  var folder = path.join(TMP, name)
  fs.access(path.join(TMP, name), fs.R_OK | fs.W_OK, function (err) {
    downloadPackage(function (err) {
      if (err) throw err
      runStandard()
    })

    function downloadPackage (cb) {
      if (err) gitClone(cb)
      else gitPull(cb)
    }

    function gitClone (cb) {
      var args = [ 'clone', '--depth', 1, url, path.join(TMP, name) ]
      spawn(GIT, args, { stdio: 'ignore' }, function (err) {
        if (err) err.message += ' (git clone) (' + name + ')'
        cb(err)
      })
    }

    function gitPull (cb) {
      var args = [ 'pull' ]
      spawn(GIT, args, { cwd: folder, stdio: 'ignore' }, function (err) {
        if (err) err.message += ' (git pull) (' + name + ')'
        cb(err)
      })
    }

    function runStandard () {
      var args = [ '--verbose' ]
      if (pkg.args) args.push.apply(args, pkg.args)
      spawn(STANDARD, args, { cwd: folder }, function (err) {
        var str = name + ' (' + pkg.repo + ')'
        if (err) { t.fail(str) } else { t.pass(str) }
      })
    }
  })
})

function spawn (command, args, opts, cb) {
  if (!opts.stdio) opts.stdio = 'inherit'

  var child = crossSpawn(command, args, opts)
  child.on('error', cb)
  child.on('close', function (code) {
    if (code !== 0) return cb(new Error('non-zero exit code: ' + code))
    cb(null)
  })
  return child
}
