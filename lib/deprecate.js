'use strict'

const BB = require('bluebird')

const fetch = require('npm-registry-fetch')
const npm = require('./npm.js')
const npa = require('npm-package-arg')
const readUserInfo = require('./utils/read-user-info.js')
const semver = require('semver')
const whoami = require('./whoami.js')

module.exports = deprecate

deprecate.usage = 'npm deprecate <pkg>[@<version>] <message>'

deprecate.completion = function (opts, cb) {
  return BB.try(() => {
    if (opts.conf.argv.remain.length > 2) { return }
    return whoami([], true, () => {}).then(username => {
      if (username) {
        // first, get a list of remote packages this user owns.
        // once we have a user account, then don't complete anything.
        // get the list of packages by user
        return fetch(
          `/-/by-user/${encodeURIComponent(username)}`,
          npm.figgyConfig
        ).then(list => list[username])
      }
    })
  }).nodeify(cb)
}

function deprecate ([pkg, msg], cb) {
  return BB.try(() => {
    if (msg == null) throw new Error(`Usage: ${deprecate.usage}`)
    // fetch the data and make sure it exists.
    const p = npa(pkg)

    // npa makes the default spec "latest", but for deprecation
    // "*" is the appropriate default.
    const spec = p.rawSpec === '' ? '*' : p.fetchSpec

    if (semver.validRange(spec, true) === null) {
      throw new Error('invalid version range: ' + spec)
    }

    const uri = '/' + p.escapedName
    return fetch.json(uri, npm.figgyConfig.concat({
      spec: p,
      query: {write: true}
    })).then(packument => {
      // filter all the versions that match
      Object.keys(packument.versions)
        .filter(v => semver.satisfies(v, spec))
        .forEach(v => { packument.versions[v].deprecated = msg })
      return fetch(uri, npm.figgyConfig.concat({
        spec: p,
        method: 'PUT',
        body: packument
      })).catch(err => {
        if (err.code === 'EOTP') {
          return readUserInfo.otp('Enter OTP: ').then(otp => {
            npm.config.set('otp', otp)
            return deprecate([pkg, msg], () => {})
          })
        } else {
          throw err
        }
      })
    })
  }).nodeify(cb)
}
