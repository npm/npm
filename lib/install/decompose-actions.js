'use strict'
var validate = require('aproba')

module.exports = function (differences, decomposed, next) {
  validate('AAF', arguments)
  differences.forEach(function (action) {
    var cmd = action[0]
    var pkg = action[1]
    switch (cmd) {
      case 'add':
      case 'update':
        decomposed.push(['fetch', pkg])
        decomposed.push(['extract', pkg])
        decomposed.push(['preinstall', pkg])
        decomposed.push(['build', pkg])
        decomposed.push(['install', pkg])
        decomposed.push(['postinstall', pkg])
        decomposed.push(['test', pkg])
        decomposed.push(['finalize', pkg])
        break
      case 'move':
        decomposed.push(['move', pkg])
        decomposed.push(['build', pkg])
        decomposed.push(['install', pkg])
        decomposed.push(['postinstall', pkg])
        decomposed.push(['test', pkg])
        break
      case 'remove':
      case 'update-linked':
      default:
        decomposed.push([cmd, pkg])
    }
  })
  next()
}
