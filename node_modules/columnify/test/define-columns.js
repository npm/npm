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

test('removes description column', function(t) {
  t.plan(1)
  var result = columnify(data, {
    include: ['name', 'version'],
  })
  t.ok(!(/description/gi.test(result)))
})

