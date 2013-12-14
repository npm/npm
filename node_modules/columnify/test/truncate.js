var test = require('tape')
var fs = require('fs')

var columnify =  require('../')

var data = [{
  name: 'mod1',
  description: 'some description which happens to be far larger than the max',
  version: '0.0.1',
}, {
  name: 'module-two',
  description: 'another description larger than the max',
  version: '0.2.0',
}]

test('widths are limited when truncation enabled', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/truncate-expected.txt', 'utf8')
  t.equal(columnify(data, {
    truncate: true,
    widths: {
      description: {
        maxWidth: 20
      }
    }
  }).trim(), expected.trim())
})

