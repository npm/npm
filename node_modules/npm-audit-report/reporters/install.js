'use strict'

const Utils = require('../lib/utils')

const report = function (data, options) {
  const defaults = {
    severityThreshold: 'info'
  }

  const config = Object.assign({}, defaults, options)

  function clr (str, clr) { return Utils.color(str, clr, config.withColor) }
  function green (str) { return clr(str, 'brightGreen') }
  function red (str) { return clr(str, 'brightRed') }

  let output = ''

  const log = function (value) {
    output = output + value + '\n'
  }

  output += 'found '

  if (Object.keys(data.advisories).length === 0) {
    log(`${green('0')} vulnerabilities`)
    return {
      report: output.trim(),
      exitCode: 0
    }
  } else {
    let total = 0
    const sev = []

    const keys = Object.keys(data.metadata.vulnerabilities)
    for (let key of keys) {
      const value = data.metadata.vulnerabilities[key]
      total = total + value
      if (value > 0) {
        sev.push([key, value])
      }
    }

    if (sev.length > 1) {
      const severities = sev.map((value) => {
        return `${value[1]} ${Utils.severityLabel(value[0], config.withColor).toLowerCase()}`
      }).join(', ')
      log(`${red(total)} vulnerabilities (${severities})`)
    } else {
      const vulnCount = sev[0][1]
      const vulnLabel = Utils.severityLabel(sev[0][0], config.withColor).toLowerCase()
      log(`${vulnCount} ${vulnLabel} severity vulnerabilit${vulnCount === 1 ? 'y' : 'ies'}`)
    }
    log('  run `npm audit fix` to install recommended updates')
    return {
      report: output.trim(),
      exitCode: 1
    }
  }
}

module.exports = report
