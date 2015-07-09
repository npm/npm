'use strict'
var test = require('tap').test
var requireInject = require('require-inject')
var path = require('path')
var log = require('npmlog')
var inherits = require('inherits')

var packages = {
  abc: {package: {name: 'abc'}, path: path.join(__dirname, 'node_modules', 'abc')},
  def: {package: {name: 'def'}, path: path.join(__dirname, 'node_modules', 'def')},
  ghi: {package: {name: 'ghi'}, path: path.join(__dirname, 'node_modules', 'ghi')},
  jkl: {package: {name: 'jkl'}, path: path.join(__dirname, 'node_modules', 'jkl')}
}
var dir = {}
dir[__dirname] ={ children: [ packages.abc, packages.def, packages.ghi, packages.jkl ] }
dir[packages.abc.path] = packages.abc
dir[packages.def.path] = packages.def
dir[packages.ghi.path] = packages.ghi
dir[packages.jkl.path] = packages.jkl

var rpt = function (root, cb) {
  cb(null, dir[root])
}
rpt.Node = function () {
  this.children = []
}

var npm = requireInject.installGlobally('../../lib/npm.js', {
  'read-package-tree': rpt
})

test('setup', function (t) {
  npm.load(function () {
    t.pass('npm loaded')
    t.end()
  })
})

function loadArgMetadata (cb) {
  this.args = this.args.map(function (arg) { return {name: arg} })
  cb()
}

test('installer', function (t) {
  t.plan(1)
  var Installer = require('../../lib/install.js').Installer
  var TestInstaller = function () {
    Installer.apply(this, arguments)
    this.global = true
  }
  inherits(TestInstaller, Installer)
  TestInstaller.prototype.loadArgMetadata = loadArgMetadata

  var inst = new TestInstaller(__dirname, false, ['def', 'abc'])
  inst.loadCurrentTree(function () {
    var kids = inst.currentTree.children.map(function (child) { return child.package.name })
    t.isDeeply(kids, ['def', 'abc'])
    t.end()
  })
})

test('uninstaller', function (t) {
  t.plan(1)
  var Uninstaller = require('../../lib/uninstall.js').Uninstaller
  var TestUninstaller = function () {
    Uninstaller.apply(this, arguments)
    this.global = true
  }
  inherits(TestUninstaller, Uninstaller)

  var uninst = new TestUninstaller(__dirname, false, ['ghi', 'jkl'])
  uninst.loadCurrentTree(function () {
    var kids = uninst.currentTree.children.map(function (child) { return child.package.name })
    t.isDeeply(kids, ['ghi', 'jkl'])
    t.end()
  })
})
