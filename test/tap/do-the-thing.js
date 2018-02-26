'use strict'

const common = require('../common-tap.js')
const test = require('tap').test

test('do the thing', (t) => {
  return common.npm([
    'do-the-thing',
    'arg',
    '--do-the-opt', 'hello world',
    '--json',
    '--registry', common.registry
  ], {})
  .then((ret) => {
    const code = ret[0]
    const stdout = ret[1]
    const stderr = ret[2]
    t.comment(stderr)
    t.comment(stdout)
    t.equal(code, 0, 'exited successfully')
    t.deepEqual(
      JSON.parse(stdout),
      {
        args: ['arg'],
        opt: 'hello world'
      },
      'successfully did the thing'
    )
    t.done()
  })
})
