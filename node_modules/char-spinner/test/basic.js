var test = require('tap').test
var spinner = require('../spin.js')

test('does nothing when not a tty', function(t) {
  var int = spinner({
    stream: { write: function(c) {
      throw new Error('wrote something: ' + JSON.stringify(c))
    }, isTTY: false },
  })
  t.notOk(int)
  t.end()
})

test('write spinny stuff', function(t) {
  var output = ''
  var written = 0
  var expect = "\r \rb\r\r \rc\r\r \rd\r\r \re\r\r \rf\r\r \rg\r\r \rh\r\r \ri\r\r \rj\r\r \rk\r\r \rl\r\r \rm\r\r \rn\r\r \ro\r\r \rp\r\r \ra\r\r \rb\r\r \rc\r\r \rd\r\r \re\r\r \rf\r\r \rg\r\r \rh\r\r \ri\r\r \rj\r\r \rk\r\r \rl\r\r \rm\r\r \rn\r\r \ro\r\r \rp\r\r \ra\r\r \rb\r\r \rc\r\r \rd\r\r \re\r\r \rf\r\r \rg\r\r \rh\r\r \ri\r\r \rj\r\r \rk\r\r \rl\r\r \rm\r\r \rn\r\r \ro\r\r \rp\r\r \ra\r\r \rb\r\r \rc\r"

  var int = spinner({
    interval: 0,
    string: 'abcdefghijklmnop',
    stream: {
      write: function(c) {
        output += c
        if (++written == 50) {
          t.equal(output, expect)
          clearInterval(int)
          t.end()
        }
      },
      isTTY: true
    },
    cleanup: false
  })
})
