'use strict'
const fs = require('graceful-fs')
const Bluebird = require('bluebird')
const audit = require('./install/audit.js')
const npm = require('./npm.js')
const log = require('npmlog')
const parseJson = require('json-parse-better-errors')
const lockVerify = require('lock-verify')

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
  if (npm.config.get('global')) {
    const err = new Error('`npm audit` does not support testing globals')
    err.code = 'EAUDITGLOBAL'
    throw err
  }
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
    return lockVerify(npm.prefix).then(result => {
      if (result.status) return audit.generate(sw, requires)

      const lockFile = shrinkwrap ? 'npm-shrinkwrap.json' : 'package-lock.json'
      const err = new Error(`Errors were found in your ${lockFile}, run  npm install  to fix them.\n    ` +
        result.errors.join('\n    '))
      err.code = 'ELOCKVERIFY'
      throw err
    })
  }).then((auditReport) => {
    return audit.submitForFullReport(auditReport)
  }).catch(err => {
    if (err.statusCode === 404 || err.statusCode >= 500) {
      const ne = new Error(`Your configured registry (${npm.config.get('registry')}) does not support audit requests.`)
      ne.code = 'ENOAUDIT'
      ne.wrapped = err
      throw ne
    }
    throw err
  }).then((auditResult) => {
    const vulns =
      auditResult.metadata.vulnerabilities.low +
      auditResult.metadata.vulnerabilities.moderate +
      auditResult.metadata.vulnerabilities.high +
      auditResult.metadata.vulnerabilities.critical
    if (vulns > 0) process.exitCode = 1
    return audit.printFullReport(auditResult)
  }).asCallback(cb)
}
