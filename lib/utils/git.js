'use strict'

const BB = require('bluebird')

const exec = require('child_process').execFile
const execSync = require('child_process').execFileSync
const spawn = require('./spawn')
const npm = require('../npm.js')
const which = require('which')
const git = npm.config.get('git')
const assert = require('assert')
const log = require('npmlog')
const noProgressTillDone = require('./no-progress-while-running.js').tillDone

exports.spawn = spawnGit
exports.exec = BB.promisify(execGit)
exports.chainableExec = chainableExec
exports.whichAndExec = whichAndExec
exports.whichAndExecSync = whichAndExecSync

function prefixGitArgs () {
  return process.platform === 'win32' ? ['-c', 'core.longpaths=true'] : []
}

function execGit (args, options, cb) {
  log.info('git', args)
  const fullArgs = prefixGitArgs().concat(args || [])
  return exec(git, fullArgs, options, noProgressTillDone(cb))
}

function execSyncGit (args, options) {
  log.info('git', args)
  var fullArgs = prefixGitArgs().concat(args || [])
  return execSync(git, fullArgs, options)
}

function spawnGit (args, options) {
  log.info('git', args)
  return spawn(git, prefixGitArgs().concat(args || []), options)
}

function chainableExec () {
  var args = Array.prototype.slice.call(arguments)
  return [execGit].concat(args)
}

function whichAndExec (args, options, cb) {
  assert.equal(typeof cb, 'function', 'no callback provided')
  // check for git
  which(git, function (err) {
    if (err) {
      err.code = 'ENOGIT'
      return cb(err)
    }

    execGit(args, options, cb)
  })
}

function whichAndExecSync (args, options) {
  try {
    which.sync(git)
  } catch (err) {
    err.code = 'ENOGIT'
    throw err
  }
  execSyncGit(args, options)
}
