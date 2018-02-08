'use strict'
const onExit = require('signal-exit')
const yargs = require('yargs')
const path = require('path')
const fs = require('fs')
const binName = path.basename(require.main.filename, '.js')
const mainPath = path.resolve(require.main.paths[0], '..')

module.exports = function (entry) {
  let started = false
  let exited = false
  onExit((code, signal) => {
    if (started && !exited) {
      if (signal) {
        console.error('Abnormal exit:', signal)
      } else {
        console.error('Abnormal exit: Promises not resolved')
      }
      process.exit(code || 1)
    }
  })
  fs.readFile(mainPath + '/package.json', (err, data) => {
    try {
      const pkg = JSON.parse(data)
      const nameMatch = new RegExp(binName, 'i')
      let isInPackage = typeof pkg.bin === 'string'
        ? nameMatch.test(pkg.bin)
        : Object.keys(pkg.bin).some(b => nameMatch.test(b) || nameMatch.test(pkg.bin[b]))
      if (isInPackage) {
        const updateNotifier = require('update-notifier');
        updateNotifier({pkg: pkg}).notify()
      }
    } catch (ex) { /* don't care */ }
  })

  setImmediate(() => {
    const argv = yargs.argv
    started = true
    try {
      const appPromise = entry.apply(null, [argv].concat(argv._))
      if (!appPromise || !appPromise.then) {
        return onError(new Error('Error: Application entry point' + (entry.name ? ` (${entry.name})` : '') + ' did not return a promise.'))
      }
      appPromise.then(() => exited = true, onError)
    } catch (ex) {
      onError (ex)
    }
    function onError (err) {
      exited = true
      if (typeof err === 'number') {
        process.exit(err)
      } else if (err) {
        console.error(err && err.stack ? err.stack : err)
      }
      process.exit(1)
    }
  })
  return yargs
}

