'use strict'

var stripBOM = require('strip-bom')

var parseJSON = module.exports = function (content) {
  return JSON.parse(stripBOM(content))
}

parseJSON.noExceptions = function (content) {
  try {
    return parseJSON(content)
  } catch (ex) {
    return
  }
}
