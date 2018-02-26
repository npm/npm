'use strict'

const BB = require('bluebird')

const log = require('npmlog')
const npm = require('./npm.js')
const usage = require('./utils/usage.js')
const util = require('util')
const validate = require('aproba')

doTheThing.usage = usage(
  'do-the-thing',
  '\ndo-the-thing <arg>',
  '\ndo-the-thing --do-the-opt <something>'
)

doTheThing.completion = (opts, cb) => {
  validate('OF', [opts, cb])
  return cb(null, []) // fill in this array with completion values
}

module.exports = (args, cb) => BB.resolve(doTheThing(args)).nodeify(cb)
function doTheThing (args) {
  if (npm.config.get('json')) {
    return console.log(JSON.stringify({
      args,
      opt: npm.config.get('do-the-opt')
    }))
  }
  log.notice('doTheThing', 'Got args:', util.inspect(args, {color: npm.color}))
  log.notice('doTheOpts', '--do-the-opt', npm.config.get('do-the-opt'))
  return BB.resolve()
}
