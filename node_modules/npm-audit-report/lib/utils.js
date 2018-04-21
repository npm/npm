'use strict'

const colors = require('ansicolors')

const severityColors = {
  critical: colors.magenta,
  high: colors.red,
  moderate: colors.yellow,
  low: function (str) { return str }
}

const severityLabel = function (sev, withColor) {
  if (withColor) {
    return severityColors[sev](sev)
  }
  return sev
}

const color = function (value, color, withColor) {
  if (withColor) {
    return colors[color](value)
  }
  return value
}

module.exports = {
  severityLabel: severityLabel,
  color: color
}
