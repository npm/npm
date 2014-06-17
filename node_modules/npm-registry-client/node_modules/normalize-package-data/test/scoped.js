var test = require("tap").test

var fixNameField = require("../lib/fixer.js").fixNameField

test("a simple scoped module has a valid name", function (t) {
  var data = {name : "@org/package"}
  fixNameField(data, false)
  t.equal(data.name, "@org/package", "name was unchanged")

  t.end()
})

test("'org@package' is not a valid name", function (t) {
  t.throws(function () {
    var data = {name : "org@package"}
    fixNameField(data, false)
  }, "blows up as expected")

  t.end()
})

test("'org=package' is not a valid name", function (t) {
  t.throws(function () {
    var data = {name : "org=package"}
    fixNameField(data, false)
  }, "blows up as expected")

  t.end()
})

test("'@org=sub/package' is not a valid name", function (t) {
  t.throws(function () {
    var data = {name : "@org=sub/package"}
    fixNameField(data, false)
  }, "blows up as expected")

  t.end()
})
