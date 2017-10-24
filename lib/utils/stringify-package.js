'use strict'

module.exports = stringifyPackage

function stringifyPackage (data, indent, lineEnding) {
  lineEnding = lineEnding || '\n'
  var json = JSON.stringify(data, null, indent || 2)

  if (lineEnding === '\r\n') {
    json = json.replace(/\n/g, '\r\n')
  }

  return json + lineEnding
}
