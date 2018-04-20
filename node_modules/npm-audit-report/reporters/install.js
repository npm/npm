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
    log(`${Utils.color('[+]', 'green', config.withColor)} no known vulnerabilities found [${data.metadata.totalDependencies} packages audited]`)
    return {
      report: output,
      exitCode: 0
    }
  } else {
    let total = 0

    const severities = Object.entries(data.metadata.vulnerabilities).filter((value) => {
      total = total + value[1]
      if (value[1] > 0) {
        return true
      }
    }).map((value) => {
      return `${value[1]} ${Utils.severityLabel(value[0], config.withColor)}`
    }).join(' | ')

    log(`${Utils.color('[!]', 'red', config.withColor)} ${total} ${total === 1 ? 'vulnerability' : 'vulnerabilities'} found [${data.metadata.totalDependencies} packages audited]`)
    log(`    Severity: ${severities}`)
    log(`    Run \`npm audit\` for more detail`)
    return {
      report: output,
      exitCode: 1
    }
  }
}

module.exports = report
