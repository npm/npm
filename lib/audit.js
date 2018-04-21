'use strict'
const fs = require('graceful-fs')
const Bluebird = require('bluebird')
const audit = require('./install/audit.js')
const npm = require('./npm.js')
const log = require('npmlog')
const parseJson = require('json-parse-better-errors')

const readFile = Bluebird.promisify(fs.readFile)

module.exports = auditCmd

auditCmd.usage =
  'npm audit\n'

auditCmd.completion = function (opts, cb) {
  const argv = opts.conf.argv.remain

  switch (argv[2]) {
    case 'audit':
      return cb(null, [])
    default:
      return cb(new Error(argv[2] + ' not recognized'))
  }
}

function maybeReadFile (name) {
  const file = `${npm.prefix}/${name}`
  return readFile(file)
    .then((data) => {
      try {
        return parseJson(data)
      } catch (ex) {
        ex.code = 'EJSONPARSE'
        throw ex
      }
    })
    .catch({code: 'ENOENT'}, () => null)
    .catch(ex => {
      ex.file = file
      throw ex
    })
}

function auditCmd (args, cb) {
  return Bluebird.all([
    maybeReadFile('npm-shrinkwrap.json'),
    maybeReadFile('package-lock.json'),
    maybeReadFile('package.json')
  ]).spread((shrinkwrap, lockfile, pkgJson) => {
    const sw = shrinkwrap || lockfile
    if (!pkgJson) {
      const err = new Error('No package.json found: Cannot audit a project without a package.json')
      err.code = 'EAUDITNOPJSON'
      throw err
    }
    if (!sw) {
      const err = new Error('Neither npm-shrinkwrap.json nor package-lock.json found: Cannot audit a project without a lockfile')
      err.code = 'EAUDITNOLOCK'
      throw err
    } else if (shrinkwrap && lockfile) {
      log.warn('audit', 'Both npm-shrinkwrap.json and package-lock.json exist, using npm-shrinkwrap.json.')
    }
    const requires = Object.assign(
      {},
      (pkgJson && pkgJson.dependencies) || {},
      (pkgJson && pkgJson.devDependencies) || {}
    )
    return audit.generate(sw, requires)
  }).then((auditReport) => {
    return audit.submitForFullReport(auditReport)
  }).catch(err => {
    if (err.statusCode >= 400) {
      const ne = new Error(`Your configured registry (${npm.config.get('registry')}) does not support audit requests.`)
      ne.code = 'ENOAUDIT'
      ne.wrapped = err
      throw ne
    }
    throw err
  }).then((auditResult) => {
    return audit.printFullReport(auditResult)
  }).asCallback(cb)
}
