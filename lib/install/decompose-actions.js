'use strict'
var fs = require('fs')
var path = require('path')
var validate = require('aproba')
var asyncMap = require('slide').asyncMap
var npm = require('../npm.js')

module.exports = function (differences, decomposed, next) {
  validate('AAF', arguments)
  asyncMap(differences, function (action, done) {
    var cmd = action[0]
    var pkg = action[1]
    switch (cmd) {
      case 'add':
      case 'update':
        if (npm.config.get('link') && !npm.config.get('global')) {
          linkSteps(decomposed, pkg, done)
        } else {
          addSteps(decomposed, pkg, done)
        }
        break
      case 'move':
        moveSteps(decomposed, pkg, done)
        break
      case 'remove':
      case 'update-linked':
      default:
        defaultSteps(decomposed, cmd, pkg, done)
    }
  }, next)
}

function safeJSONparse (data) {
  try {
    return JSON.parse(data)
  }
  catch (ex) {
    return
  }
}

function linkSteps(decomposed, pkg, done) {
  // is pkg not installed globally or the wrong version:
    // push on a 'global-install', pkg step
  var globalPackage = path.resolve(npm.globalPrefix, 'lib', 'node_modules', pkg.package.name)
  var globalPackageJson = path.resolve(globalPackage, 'package.json')
  fs.stat(globalPackage, function (er) {
    if (er) {
      decomposed.push(['global-install', pkg])
      decomposed.push(['global-link', pkg])
      return done()
    }
    fs.readFile(globalPackageJson, function (err, data) {
      var json = safeJSONparse(data)
      if (!json || json.version !== pkg.package.version) return addSteps(decomposed, pkg, done)

      decomposed.push(['global-link', pkg])
      return done()
    })
  })
}

function addSteps(decomposed, pkg, done) {
  decomposed.push(['fetch', pkg])
  decomposed.push(['extract', pkg])
  decomposed.push(['preinstall', pkg])
  decomposed.push(['build', pkg])
  decomposed.push(['install', pkg])
  decomposed.push(['postinstall', pkg])
  decomposed.push(['test', pkg])
  decomposed.push(['finalize', pkg])
  done()
}

function moveSteps(decomposed, pkg, done) {
  decomposed.push(['move', pkg])
  decomposed.push(['build', pkg])
  decomposed.push(['install', pkg])
  decomposed.push(['postinstall', pkg])
  decomposed.push(['test', pkg])
  done()
}

function defaultSteps(decomposed, cmd, pkg, done) {
  decomposed.push([cmd, pkg])
  done()
}
