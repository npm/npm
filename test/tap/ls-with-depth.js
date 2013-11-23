var test = require('tap').test
  , spawn = require('child_process').spawn
  , node = process.execPath
  , npm = require.resolve('../../')
  , path = require('path')
  , opts = { cwd: path.resolve(__dirname, 'ls-with-depth') }
  , entryRE = /(├|└)─/g
  , unmetRE = /UNMET DEPENDENCY/g
  , errRE = /npm ERR!/g

test('ls --depth=0', function (t) {
  var out = ''
    , err = ''
    , child = spawn(node, [npm, 'ls', '--depth=0'], opts)
  child.stdout.on('data', function (buf) {
    out += buf.toString()
  })
  child.stderr.on('data', function (buf) {
    err += buf.toString()
  })
  child.on('exit', function () {
    t.equal(countEntries(out), 3, 'should find 3 packages')
    t.equal(countUnmet(out), 1, 'should find 1 unmet dependencies')
    t.equal(countErrors(err), 2, 'should print 2 ERR messages')
    t.end()
  })
})

test('ls --depth=1', function (t) {
  var out = ''
    , err = ''
    , child = spawn(node, [npm, 'ls', '--depth=1'], opts)
  child.stdout.on('data', function (buf) {
    out += buf.toString()
  })
  child.stderr.on('data', function (buf) {
    err += buf.toString()
  })
  child.on('exit', function () {
    t.equal(countEntries(out), 4, 'should find 4 packages')
    t.equal(countUnmet(out), 2, 'should find 2 unmet dependencies')
    t.equal(countErrors(err), 3, 'should print 3 ERR messages')
    t.end()
  })
})

function countEntries (input) {
  var match = input.match(entryRE)
  return match ? match.length : 0
}

function countUnmet (input) {
  var match = input.match(unmetRE)
  return match ? match.length : 0
}

function countErrors (input) {
  var match = input.match(errRE)
  return match ? match.length : 0
}