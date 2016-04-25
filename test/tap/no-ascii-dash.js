'use strict'
var test = require('tap').test
var common = require('../common-tap.js')

test('valid option specifiers', function (t) {
  common.npm(['-hyphen-minus'], {}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.is(stderr, '', 'hyphen-minus (-)')
    t.done()
  })
})

var dashLikeChars = {
  '\u2010': 'hyphen',
  '\u2011': 'non-breaking-hyphen',
  '\u2012': 'figure-dash',
  '\u2013': 'endash',
  '\u2014': 'emdash',
  '\u2015': 'horizontal-bar',
  '\u2212': 'minus',
  '\ufe58': 'small-emdash',
  '\ufe63': 'small-hyphen-minus',
  '\uff0d': 'full-width-hyphen-minus'
}

test('invalid option specifiers', function (t) {
  var dashes = Object.keys(dashLikeChars)
  t.plan(dashes.length)
  dashes.forEach(function (dash) {
    var name = dashLikeChars[dash]
    common.npm([dash + name], {}, function (err, code, stdout, stderr) {
      if (err) throw err
      t.match(stderr, new RegExp('npm ERR.*' + dash + name), name + ' (' + dash + ')')
    })
  })
})
