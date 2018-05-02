'use strict'
exports.severityLabel = severityLabel
exports.color = color

const ccs = require('console-control-strings')

const severityColors = {
  critical: 'brightMagenta',
  high: 'brightRed',
  moderate: 'brightYellow',
  low: null
}

function color (value, colorName, withColor) {
  return (colorName && withColor) ? ccs.color(colorName) + value + ccs.color('reset') : value
}

function severityLabel (sev, withColor) {
  return color(sev, severityColors[sev], withColor)
}
