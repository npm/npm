'use strict'

module.exports = detectLineEnding

function detectLineEnding (str) {
  const lfIndex = str.indexOf('\n')
  return lfIndex > 0 && str[lfIndex - 1] === '\r'
    ? '\r\n'
    : '\n'
}
