var log = require('npmlog')
var fetch = require('node-fetch-npm')
var semver = require('semver')

function getLatestNodejsVersion (url, cb) {
  var tracker = log.newItem('getLatestNodejsVersion', 1)
  tracker.info('getLatestNodejsVersion', 'Getting Node.js release information')
  var version = 'v0.0.0'
  url = url || 'https://nodejs.org/dist/index.json'

  fetch(url)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error('Status not 200, ' + res.status)
      }
      return res.json()
    })
    .then((json) => {
      json.forEach(function (item) {
        if (item.lts && semver.gt(item.version, version)) version = item.version
      })
      cb(null, version)
    })
    .catch((e) => cb(e))
}

module.exports = getLatestNodejsVersion
