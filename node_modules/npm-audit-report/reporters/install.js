'use strict'

const Utils = require('../lib/utils')

const report = function (data, options) {
  const defaults = {
    severityThreshold: 'info'
  }

  const config = Object.assign({}, defaults, options)

  let output = ''

  const log = function (value) {
    output = output + value + '\n'
  }

  if (Object.keys(data.advisories).length === 0) {
    log(`${Utils.color('[+]', 'brightGreen', config.withColor)} no known vulnerabilities found [${data.metadata.totalDependencies} packages audited]`)
    return {
      report: output,
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
    const severities = sev.map((value) => {
      return `${value[1]} ${Utils.severityLabel(value[0], false)}`
    }).join(' | ')

    log(`${Utils.color('[!]', 'brightRed', config.withColor)} ${total} ${total === 1 ? 'vulnerability' : 'vulnerabilities'} found [${data.metadata.totalDependencies} packages audited]`)
    log(`    Severity: ${severities}`)
    log(`    Run \`npm audit\` for more detail`)
    return {
      report: output,
      exitCode: 1
    }
  }
}

module.exports = report
