var test = require('tape')

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


test('column headings are uppercased by default', function(t) {
  t.plan(3)
  var result = columnify(data)
  var headings = result.split('\n')[0]// first line
  t.ok(headings.indexOf('NAME') !== -1, 'NAME exists')
  t.ok(headings.indexOf('DESCRIPTION') !== -1, 'DESCRIPTION exists')
  t.ok(headings.indexOf('VERSION') !== -1, 'VERSION exists')
})

test('headings can be transformed by a function', function(t) {
  t.plan(3)
  var result = columnify(data, {
    headingTransform: function(name) {
      return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
    }
  })
  var headings = result.split('\n')[0] // first line
  t.ok(headings.indexOf('Name') !== -1, 'Name exists')
  t.ok(headings.indexOf('Description') !== -1, 'Description exists')
  t.ok(headings.indexOf('Version') !== -1, 'Version exists')
})

test('headings can be transformed on a per-column basis', function(t) {
  t.plan(3)
  var result = columnify(data, {
    config: {
      // leave default uppercase heading
      name: {
        headingTransform: function(name) { // only title case name
          return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
        }
      }
    }
  })
  var headings = result.split('\n')[0] // first line
  t.ok(headings.indexOf('Name') !== -1, 'Name exists')
  t.ok(headings.indexOf('DESCRIPTION') !== -1, 'Description exists')
  t.ok(headings.indexOf('VERSION') !== -1, 'Version exists')
})
