'use strict'

const BB = require('bluebird')

const fs = require('graceful-fs')
const iferr = require('iferr')
const inflateShrinkwrap = require('./inflate-shrinkwrap.js')
const log = require('npmlog')
const parseJSON = require('../utils/parse-json.js')
const path = require('path')

const readFileAsync = BB.promisify(fs.readFile)

module.exports = readShrinkwrap
function readShrinkwrap (child, next) {
  if (child.package._shrinkwrap) return process.nextTick(next)
  BB.join(
    readLockfile('npm-shrinkwrap.json', child),
    // Don't read non-root lockfiles
    child.isTop && readLockfile('package-lock.json', child),
    (shrinkwrap, lockfile) => {
      if (shrinkwrap && lockfile) {
        log.warn('read-shrinkwrap', 'Ignoring package-lock.json because there is already an npm-shrinkwrap.json. Please use only one of the two.')
      }
      if (shrinkwrap || lockfile) {
        try {
          child.package._shrinkwrap = parseJSON(shrinkwrap || lockfile)
        } catch (ex) {
          child.package._shrinkwrap = null
          throw ex
        }
      } else {
        child.package._shrinkwrap = null
      }
    }
  ).then(() => next(), next)
}

function readLockfile (name, child) {
  return readFileAsync(
    path.join(child.path, name)
  ).catch({code: 'ENOENT'}, () => null)
}

module.exports.andInflate = function (child, next) {
  readShrinkwrap(child, iferr(next, function () {
    if (child.package._shrinkwrap) {
      return inflateShrinkwrap(child, child.package._shrinkwrap.dependencies || {}, next)
    } else {
      return next()
    }
  }))
}
