var npm = require('../npm.js')
var configDefs = require('../config/defaults')

module.exports = require('i18npm')({
  version: npm.version,
  path: npm.config.get('locale-file-directory'),
  fallbackPath: configDefs.defaults['locale-file-directory']
})
