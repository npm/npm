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
}, {
  name: 'mod3',
  description: 'thisisaverylongwordandshouldbewrapped',
  version: '0.3.0',
}, {
  name: 'module-four-four-four-four',
  description: '',
  version: '0.0.4',
}]

test('wrapping wide columns', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/wrap-expected.txt', 'utf8')
  t.equal(columnify(data, {
    config: {
      description: {
        maxWidth: 30,
        minWidth: 10
      }
    }
  }).trim(), expected.trim())
})
