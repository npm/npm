'use strict'

const npm = require('../npm')
const log = require('npmlog')
const packToStream = require('../utils/tar').packToStream
const path = require('path')

let effectiveOwner

module.exports = pacoteOpts
function pacoteOpts (moreOpts) {
  const ownerStats = calculateOwner()
  const opts = {
    cache: path.join(npm.config.get('cache'), '_cacache'),
    defaultTag: npm.config.get('tag'),
    dirPacker: packToStream,
    hashAlgorithm: 'sha1',
    localAddress: npm.config.get('local-address'),
    log: log,
    maxAge: npm.config.get('cache-min'),
    maxSockets: npm.config.get('maxsockets'),
    offline: npm.config.get('offline'),
    preferOffline: npm.config.get('prefer-offline') || npm.config.get('cache-min') > 9999,
    preferOnline: npm.config.get('prefer-online') || npm.config.get('cache-max') <= 0,
    projectScope: npm.projectScope,
    proxy: npm.config.get('https-proxy') || npm.config.get('proxy'),
    refer: npm.registry.refer,
    registry: npm.config.get('registry'),
    retry: {
      retries: npm.config.get('fetch-retries'),
      factor: npm.config.get('fetch-retry-factor'),
      minTimeout: npm.config.get('fetch-retry-mintimeout'),
      maxTimeout: npm.config.get('fetch-retry-maxtimeout')
    },
    scope: npm.config.get('scope'),
    strictSSL: npm.config.get('strict-ssl')
  }

  if (ownerStats.uid || ownerStats.gid) {
    Object.assign(opts, ownerStats, {
      cacheUid: ownerStats.uid,
      cacheGid: ownerStats.gid
    })
  }

  npm.config.keys.forEach(function (k) {
    if (k[0] === '/' && k.match(/.*:_authToken$/)) {
      if (!opts.auth) { opts.auth = {} }
      opts.auth[k.replace(/:_authToken$/, '')] = {
        token: npm.config.get(k)
      }
    }
    if (k[0] === '@') {
      if (!opts.scopeTargets) { opts.scopeTargets = {} }
      opts.scopeTargets[k.replace(/:registry$/, '')] = npm.config.get(k)
    }
  })

  Object.keys(moreOpts || {}).forEach((k) => {
    opts[k] = moreOpts[k]
  })

  return opts
}

function calculateOwner () {
  if (!effectiveOwner) {
    effectiveOwner = { uid: 0, gid: 0 }

    // Pretty much only on windows
    if (!process.getuid) {
      return effectiveOwner
    }

    effectiveOwner.uid = +process.getuid()
    effectiveOwner.gid = +process.getgid()

    if (effectiveOwner.uid === 0) {
      if (process.env.SUDO_UID) effectiveOwner.uid = +process.env.SUDO_UID
      if (process.env.SUDO_GID) effectiveOwner.gid = +process.env.SUDO_GID
    }
  }

  return effectiveOwner
}

// TODO
// function adaptConfig (config) {
//   return {
//     proxy: {
//       http: config.get('proxy'),
//       https: config.get('https-proxy'),
//       localAddress: config.get('local-address')
//     },
//     ssl: {
//       certificate: config.get('cert'),
//       key: config.get('key'),
//       ca: config.get('ca'),
//       strict: config.get('strict-ssl')
//     },
//     retry: {
//       retries: config.get('fetch-retries'),
//       factor: config.get('fetch-retry-factor'),
//       minTimeout: config.get('fetch-retry-mintimeout'),
//       maxTimeout: config.get('fetch-retry-maxtimeout')
//     },
//     userAgent: config.get('user-agent'),
//     log: log,
//     defaultTag: config.get('tag'),
//     couchToken: config.get('_token'),
//     maxSockets: config.get('maxsockets'),
//     scope: npm.projectScope
//   }
// }
