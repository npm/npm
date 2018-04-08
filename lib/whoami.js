'use strict'

const BB = require('bluebird')

const fetch = require('npm-registry-fetch')
const npm = require('./npm.js')
const output = require('./utils/output.js')

module.exports = whoami

whoami.usage = 'npm whoami [--registry <registry>]\n(just prints username according to given registry)'

function whoami ([spec], silent, cb) {
  // FIXME: need tighter checking on this, but is a breaking change
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }
  return BB.try(() => {
    // First, check if we have a user/pass-based auth
    const registry = npm.config.get('registry')
    if (!registry) throw new Error('no default registry set')
    return npm.config.getCredentialsByURI(registry)
  }).then(({username, token}) => {
    if (username) {
      return username
    } else if (token) {
      return fetch.json('/-/whoami', npm.figgyConfig.concat({
        spec
      })).then(({username}) => {
        if (username) {
          return username
        } else {
          throw Object.assign(new Error(
            'Your auth token is no longer valid. Please log in again.'
          ), {code: 'ENEEDAUTH'})
        }
      })
    } else {
      // At this point, if they have a credentials object, it doesn't have a
      // token or auth in it.  Probably just the default registry.
      throw Object.assign(new Error(
        'This command requires you to be logged in.'
      ), {code: 'ENEEDAUTH'})
    }
  }).then(username => {
    if (silent) {
    } else if (npm.config.get('json')) {
      output(JSON.stringify(username))
    } else {
      output(username)
    }
    return username
  }).nodeify(cb)
}
