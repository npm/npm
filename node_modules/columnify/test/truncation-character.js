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

test('truncation character is configurable', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/truncate-expected.txt', 'utf8').replace(/…/g, '>')

  t.equal(columnify(data, {
    truncate: '>',
    widths: {
      description: {
        maxWidth: 20
      }
    }
  }).trim(), expected.trim())
})

test('truncation character can be multichar', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/truncate-multichar-expected.txt', 'utf8')

  t.equal(columnify(data, {
    truncate: '...',
    widths: {
      description: {
        maxWidth: 20
      }
    }
  }).trim(), expected.trim())
})
