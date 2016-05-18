module.exports = test

var __ = require('./utils/i18n').__
var testCmd = require('./utils/lifecycle.js').cmd('test')

function test (args, cb) {
  testCmd(args, function (er) {
    if (!er) return cb()
    if (er.code === 'ELIFECYCLE') {
      return cb(__('Test failed.  See above for more details.'))
    }
    return cb(er)
  })
}
