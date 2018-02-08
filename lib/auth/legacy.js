'use strict'
const read = require('../utils/read-user-info.js')
const profile = require('npm-profile')
const log = require('npmlog')
const npm = require('../npm.js')
const output = require('../utils/output.js')
const pacoteOpts = require('../config/pacote')
const fetchOpts = require('../config/fetch-opts')
const opener = require('opener')

const openerPromise = (url) => new Promise((resolve, reject) => {
  opener(url, { command: npm.config.get('browser') }, (er) => {
    if (er)
      reject(er)
    else
      resolve()
  })
})

const loginPrompter = (creds) => {
  const opts = { log: log }
  return read.username('Username:', creds.username, opts).then((u) => {
    creds.username = u
    return read.password('Password:', creds.password)
  }).then((p) => {
    creds.password = p
    return creds
  })
}

module.exports.login = (creds, registry, scope, cb) => {
  const conf = {
    log: log,
    creds: creds,
    registry: registry,
    auth: {
      otp: npm.config.get('otp')
    },
    scope: scope
  }
  login(conf).then((newCreds) => cb(null, newCreds)).catch(cb)
}

function login (conf) {
  return profile.login(openerPromise, loginPrompter, conf)
  .catch((er) => {
    if (er.code !== 'EOTP')
      throw er
    return read.otp('Authenticator provided OTP:').then((otp) => {
      conf.auth.otp = otp
      const u = conf.creds.username
      const p = conf.creds.password
      return profile.loginCouch(u, p, conf)
    })
  }).then((result) => {
    const newCreds = {}
    if (result && result.token) {
      newCreds.token = result.token
    } else {
      newCreds.username = conf.creds.username
      newCreds.password = conf.creds.password
      newCreds.alwaysAuth = npm.config.get('always-auth')
    }

    const usermsg = conf.creds.username ? ' user ' + conf.creds.username : ''
    conf.log.info('login', 'Authorized' + usermsg)
    const scopeMessage = conf.scope ? ' to scope ' + scope : ''
    const userout = conf.creds.username ? ' as ' + conf.creds.username : ''
    output('Logged in%s%s on %s.', userout, scopeMessage, conf.registry)
    return newCreds
  })
}

const adduserPrompter = (creds) => {
  const opts = { log: log }
  return read.username('Username:', creds.username, opts).then((u) => {
    creds.username = u
    return read.password('Password:', creds.password)
  }).then((p) => {
    creds.password = p
    return read.email('Email: (this IS public) ', creds.email, opts)
  }).then((e) => {
    creds.email = e
    return creds
  })
}

module.exports.adduser = function adduser (creds, registry, scope, cb) {
  const conf = {
    log: log,
    creds: creds,
    registry: registry,
    scope: scope
  }
  profile.adduser(openerPromise, adduserPrompter, conf)
  .then((result) => {
    const newCreds = {}
    if (result && result.token) {
      newCreds.token = result.token
    } else {
      newCreds.username = conf.creds.username
      newCreds.password = conf.creds.password
      newCreds.email = conf.creds.email
      newCreds.alwaysAuth = npm.config.get('always-auth')
    }

    const usermsg = conf.creds.username ? ' user ' + conf.creds.username : ''
    conf.log.info('adduser', 'Authorized' + usermsg)
    const scopeMessage = conf.scope ? ' to scope ' + scope : ''
    const userout = conf.creds.username ? ' as ' + conf.creds.username : ''
    output('Logged in%s%s on %s.', userout, scopeMessage, conf.registry)
    cb(null, newCreds)
  }).catch(cb)
}
