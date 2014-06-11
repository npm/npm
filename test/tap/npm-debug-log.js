var common = require("../common-tap.js")
var test = require("tap").test
var npm = require("../../")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")
var fs = require('fs')
var path = require('path')

var PKG_DIR = path.resolve(__dirname, "npm-debug-log")
var PKG = path.resolve(PKG_DIR, "package.json")
var LOG = path.resolve(PKG_DIR, "npm-debug.log")

var EXEC_OPTS = {
  cwd: PKG_DIR,
  stdio: 'ignore'
}

var DEFAULT_PKG = {
  "name": "npm-debug-log-test",
  "version": "1.2.3",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}

test('setup', function (t) {
  reset()

  npm.load(function (err) {
    t.ifError(err)
    t.end()
  })
})

test("does not create npm-debug.log for npm test", function (t) {
  reset()

  common.npm(['test'], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifError(err)
    t.notEqual(code, 0, 'exit code should be non-zero')
    t.ok(!fs.existsSync(LOG), 'log should not be created')
    t.end()
  })
})

test("creates npm-debug.log in current dir for npm run test", function (t) {
  reset()

  common.npm(['run', 'test'], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifError(err)
    t.notEqual(code, 0, 'exit code should be non-zero')
    t.ok(fs.existsSync(LOG), 'log should be created')
    t.end()
  })
})

test("configuring location of npm-debug.log", function (t) {
  reset()
  var differentLog = path.resolve(PKG_DIR, 'different.log')

  common.npm(['run', 'test', '--log-file='+differentLog], EXEC_OPTS, function (err, code, stdout, stderr) {
    t.ifError(err)
    t.notEqual(code, 0, 'exit code should be non-zero')

    t.ok(fs.existsSync(differentLog), 'log should be created in configured location')
    t.ok(!fs.existsSync(LOG), 'default log should not exist')
    t.end()
  })
})

test("cleanup", function (t) {
  reset()
  t.end()
})

function reset(extendWith) {
  fs.readdirSync(PKG_DIR).forEach(function(item) {
    rimraf.sync(path.resolve(PKG_DIR, item))
  })
  var pkg = clone(DEFAULT_PKG)
  extend(pkg, extendWith)
  for (key in extend) { pkg[key] = extend[key]}
  fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2), 'ascii')
  return pkg
}

function clone(a) {
  return extend({}, a)
}

function extend(a, b) {
  for (key in b) { a[key] = b[key]}
  return a
}

