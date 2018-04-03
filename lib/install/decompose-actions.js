'use strict'
var validate = require('aproba')
var npm = require('../npm.js')

module.exports = function (differences, decomposed, next) {
  validate('AAF', arguments)
  differences.forEach((action) => {
    var cmd = action[0]
    var pkg = action[1]
    switch (cmd) {
      case 'add':
        addSteps(decomposed, pkg)
        break
      case 'update':
        updateSteps(decomposed, pkg)
        break
      case 'move':
        moveSteps(decomposed, pkg)
        break
      case 'remove':
        removeSteps(decomposed, pkg)
        break
      default:
        defaultSteps(decomposed, cmd, pkg)
    }
  })
  next()
}

function addSteps (decomposed, pkg) {
  if (!pkg.fromBundle && !pkg.isLink) {
    decomposed.push(['fetch', pkg])
    decomposed.push(['extract', pkg])
  }
  if (!pkg.fromBundle || npm.config.get('rebuild-bundle')) {
    decomposed.push(['preinstall', pkg])
    decomposed.push(['build', pkg])
    decomposed.push(['install', pkg])
    decomposed.push(['postinstall', pkg])
  }
  if (!pkg.fromBundle || !pkg.isLink) {
    decomposed.push(['finalize', pkg])
  }
  decomposed.push(['refresh-package-json', pkg])
}

function updateSteps (decomposed, pkg) {
  removeSteps(decomposed, pkg.oldPkg)
  addSteps(decomposed, pkg)
}

function removeSteps (decomposed, pkg) {
  decomposed.push(['unbuild', pkg])
  decomposed.push(['remove', pkg])
}

function moveSteps (decomposed, pkg) {
  decomposed.push(['move', pkg])
  decomposed.push(['build', pkg])
  decomposed.push(['install', pkg])
  decomposed.push(['postinstall', pkg])
  decomposed.push(['refresh-package-json', pkg])
}

function defaultSteps (decomposed, cmd, pkg) {
  decomposed.push([cmd, pkg])
}
