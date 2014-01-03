var test = require('tape')
var fs = require('fs')

var columnify =  require('../')

var data = [{
  name: 'module1'
}, {
  name: 'module2'
}]

test('1 column', function(t) {
  t.plan(1)
  var expected = fs.readFileSync(__dirname + '/1-column-simple-expected.txt', 'utf8')
  t.equal(columnify(data).trim(), expected.trim())
})
