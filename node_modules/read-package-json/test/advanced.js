var path = require('path')
var tap = require('tap')
var readJson = require('../')

tap.test('script cwd test', function (t) {
  var p = path.resolve(__dirname, 'fixtures/scripts.json')
  readJson(p, function (er, data) {
    if (er) throw er
    advanced_(t, data)
  })
})

function advanced_ (t, data) {
  var testCmdName = 'change-cwd-test'
  var changeCwdPath = 'test/fixtures/'
  var cmdValue = 'node -e \"console.log(process.cwd())\"'

  var newPropName = '_cwdChanges'
  var newPropValue = {
    'cmd': testCmdName,
    'cwd': changeCwdPath,
    'run': cmdValue
  }

  t.ok(data)
  t.ok(data.scripts.hasOwnProperty(newPropName))
  t.deepEqual(data.scripts[newPropName][0], newPropValue)
  t.deepEqual(data.scripts[testCmdName], cmdValue)
  t.end()
}
