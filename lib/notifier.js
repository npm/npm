'use strict'

const updateNotifier = require('update-notifier')
const pkg = require('../package.json')

module.exports = notify
function notify (config) {
  const notifier = updateNotifier({pkg})
  if (
    notifier.update &&
    notifier.update.latest !== pkg.version &&
    notifier.update.current === pkg.version
  ) {
    const useUnicode = config.get('unicode')
    const useColor = config.get('color')
    const color = useColor && require('ansicolors')
    const old = notifier.update.current
    const latest = notifier.update.latest
    let type = notifier.update.type
    if (useColor) {
      switch (type) {
        case 'major':
          type = color.red(type)
          break
        case 'minor':
          type = color.yellow(type)
          break
        case 'patch':
          type = color.green(type)
          break
      }
    }
    const changelog = `https://github.com/npm/npm/releases/tag/v${latest}`
    notifier.notify({
      message: `New ${type} version of npm available! ${
        useColor ? color.red(old) : old
      } ${useUnicode ? '→' : '->'} ${
        useColor ? color.green(latest) : latest
      }\n` +
      `${
        useColor ? color.yellow('Changelog:') : 'Changelog:'
      } ${
        useColor ? color.cyan(changelog + ':') : changelog + ':'
      }\n` +
      `Run ${
        useColor ? color.green('npm install -g npm') : 'npm i -g npm'
      } to update!`
    })
  }
}
