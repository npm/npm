var test = require('tape')
var fs = require('fs')

var columnify =  require('../')

var data = [{
  name: 'module1',
  description: 'some description',
  version: '0.0.1',
}, {
  name: 'module2',
  description: 'another description',
  version: '0.2.0',
}]


test('column data can be transformed', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/data-transform-expected.txt', 'utf8')
  t.equal(columnify(data, {
    dataTransform: function(data) {
      return data.toUpperCase()
    }
  }).trim(), expected.trim())
})

test('column data can be transformed on a per-column basis', function(t) {
  t.plan(3)
  var result = columnify(data, {
    config: {
      name: {
        dataTransform: function(data) { // only uppercase name
          return data.toUpperCase()
        }
      }
    }
  })
  t.ok(result.indexOf('MODULE1') !== -1, 'Module1 name was transformed')
  t.ok(result.indexOf('MODULE2') !== -1, 'Module2 name was transformed')
  t.ok(result.indexOf('another description') !== -1, 'Description was not transformed')
})

