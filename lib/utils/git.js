// handle some git configuration for windows

exports.spawn = spawnGit
exports.chainableExec = chainableExec
exports.whichAndExec = whichAndExec

var exec = require('child_process').execFile
var spawn = require('./spawn')
var npm = require('../npm.js')
var which = require('which')
var git = npm.config.get('git')
var assert = require('assert')
var log = require('npmlog')
var win32 = process.platform === "win32"
var cygwin = win32 && (process.env.ORIGINAL_PATH || '').indexOf('/cygdrive/') != -1

function prefixGitArgs () {
  return win32 ? ["-c", "core.longpaths=true"] : []
}

function execGit (args, options, cb) {
  if(cygwin && args) {
      for(var i=0; i<args.length; i++) {
          if(':\\'.indexOf(args[i]) != 1) {
              args[i] = args[i].replace(/\\/g, '/').replace(/^([A-Za-z])\:\//, '/cygdrive/$1/');
          }
      }
  }
  var fullArgs = prefixGitArgs().concat(args || [])
  log.info('git', fullArgs)
  return exec(git, fullArgs, options, cb)
}

function spawnGit (args, options) {
  log.info('git', args)
  return spawn(git, prefixGitArgs().concat(args || []), options)
}

function chainableExec () {
  var args = Array.prototype.slice.call(arguments)
  return [execGit].concat(args)
}

function whichGit (cb) {
  return which(git, cb)
}

function whichAndExec (args, options, cb) {
  assert.equal(typeof cb, 'function', 'no callback provided')
  // check for git
  whichGit(function (err) {
    if (err) {
      err.code = 'ENOGIT'
      return cb(err)
    }

    execGit(args, options, cb)
  })
}
