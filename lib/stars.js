'use strict'

const BB = require('bluebird')

const fetch = require('npm-registry-fetch')
const log = require('npmlog')
const npm = require('./npm.js')
const output = require('./utils/output.js')
const whoami = require('./whoami.js')

stars.usage = 'npm stars [<user>]'

module.exports = stars
function stars ([user], cb) {
  return BB.try(() => {
    return (user ? BB.resolve(user) : whoami([], true, () => {})).then(usr => {
      return fetch.json('/-/_view/starredByUser', npm.figgyConfig.concat({
        query: {key: `"${usr}"`} // WHY. WHY THE ""?!
      }))
    }).then(data => data.rows).then(stars => {
      if (stars.length === 0) {
        log.warn('stars', 'user has not starred any packages.')
      } else {
        stars.forEach(s => output(s.value))
      }
    })
  }).catch(err => {
    if (err.code === 'ENEEDAUTH') {
      throw Object.assign(new Error("'npm starts' on your own user account requires auth"), {
        code: 'ENEEDAUTH'
      })
    } else {
      throw err
    }
  }).nodeify(cb)
}
