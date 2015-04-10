'use strict'
var requireInject = require('require-inject')
var test = require('tap').test

test('github-shortcut', function (t) {
  var cloneUrls = [
    ['git://github.com/foo/private.git', 'github shortcuts try git URLs first'],
    ['git@github.com:foo/private.git', 'github shortcuts try SSH second'],
    ['https://github.com/foo/private.git', 'github shortcuts try HTTPS URLs third']
  ]
  var npm = requireInject.installGlobally('../../lib/npm.js', {
    'child_process': {
      'execFile': function (cmd, args, options, cb) {
        process.nextTick(function () {
          if (args[0] !== 'clone') return cb(null, '', '')
          var cloneUrl = cloneUrls.shift()
          if (cloneUrl) {
            t.is(args[3], cloneUrl[0], cloneUrl[1])
          } else {
            t.fail('too many attempts to clone')
          }
          cb(new Error())
        })
      }
    }
  })

  npm.load({loglevel: 'silent'}, function () {
    npm.commands.install(['foo/private'], function (er, result) {
      t.end()
    })
  })
})
