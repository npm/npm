var common = require('../common-tap.js')
var test = require('tap').test
var npm = require('../../')
var osenv = require('osenv')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var pkg = path.join(__dirname, 'install@something')

test('"npm install ./package@1.2.3" should install local pkg', function(t) {
  t.plan(1)
  npm.load(function() {
    var _stat = fs.stat
    fs.stat = function(file) {
      if (file === './package@1.2.3') {
        t.ok(true, 'npm is running fs.stat("./package@1.2.3")')
        fs.stat = _stat
        t.end()
      } else {
        _stat.apply(fs, arguments)
      }
    }

    npm.commands.cache.add('./package@1.2.3', function(err) {
      t.fail('something weird is happening')
    })
  })
})

