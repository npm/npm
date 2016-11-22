module.exports = function () {
  var npmconf = require('../config/core.js')

  var configDefs = npmconf.defs
  var shorthands = configDefs.shorthands
  var types = configDefs.types
  var nopt = require('nopt')

  return nopt(types, shorthands)
}
