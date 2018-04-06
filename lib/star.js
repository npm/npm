'use strict'

const BB = require('bluebird')

const fetch = require('npm-registry-fetch')
const log = require('npmlog')
const npa = require('npm-package-arg')
const npm = require('./npm.js')
const output = require('./utils/output.js')
const usage = require('./utils/usage.js')
const whoami = require('./whoami.js')

star.usage = usage(
  'star',
  'npm star [<pkg>...]\n' +
  'npm unstar [<pkg>...]'
)

star.completion = function (opts, cb) {
  // FIXME: there used to be registry completion here, but it stopped making
  // sense somewhere around 50,000 packages on the registry
  cb()
}

module.exports = star
function star (args, cb) {
  return BB.try(() => {
    if (!args.length) throw new Error(star.usage)
    let s = npm.config.get('unicode') ? '\u2605 ' : '(*)'
    const u = npm.config.get('unicode') ? '\u2606 ' : '( )'
    const using = !(npm.command.match(/^un/))
    if (!using) s = u
    return BB.map(args.map(npa), pkg => {
      return BB.all([
        whoami([pkg], true, () => {}),
        fetch.json(pkg.escapedName, npm.figgyConfig.concat({
          spec: pkg,
          query: {write: true},
          'prefer-online': true
        }))
      ]).then(([username, fullData]) => {
        if (!username) { throw new Error('You need to be logged in!') }
        const body = {
          _id: fullData._id,
          _rev: fullData._rev,
          users: fullData.users || {}
        }

        if (using) {
          log.info('star', 'starring', body._id)
          body.users[username] = true
          log.verbose('star', 'starring', body)
        } else {
          delete body.users[username]
          log.info('star', 'unstarring', body._id)
          log.verbose('star', 'unstarring', body)
        }
        return fetch.json(pkg.escapedName, npm.figgyConfig.concat({
          spec: pkg,
          method: 'PUT',
          body
        }))
      }).then(data => {
        output(s + ' ' + pkg.name)
        log.verbose('star', data)
        return data
      })
    })
  }).nodeify(cb)
}
