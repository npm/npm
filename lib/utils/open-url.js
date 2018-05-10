'use strict'
const npm = require('../npm.js')
const output = require('./output.js')
const opener = require('opener')

// attempt to open URL in web-browser, print address otherwise:
module.exports = function open (url, errMsg, cb = () => {}, browser = npm.config.get('browser')) {
  return new Promise((resolve, reject) => {
    opener(url, { command: npm.config.get('browser') }, (er) => {
      if (er && er.code === 'ENOENT') {
        output(`${errMsg}:\n\n${url}`)
        return (cb(), resolve())
      } else {
        return (cb(er), er ? reject(er) : resolve())
      }
    })
  })
}
