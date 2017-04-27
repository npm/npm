'use strict'

var mapToRegistry = require('./utils/map-to-registry.js')
var npm = require('./npm')
var output = require('./utils/output.js')

module.exports = org

org.subcommands = ['set', 'rm', 'add']

org.usage =
  'npm org set orgname username [developer | admin | owner]\n' +
  'npm org add orgname username [developer | admin | owner]\n' +
  'npm org rm orgname username\n' +
  'npm org ls orgname'

org.completion = function (opts, cb) {
  var argv = opts.conf.argv.remain
  if (argv.length === 2) {
    return cb(null, org.subcommands)
  }
  switch (argv[2]) {
    case 'ls':
    case 'add':
    case 'rm':
    case 'set':
      return cb(null, [])
    default:
      return cb(new Error(argv[2] + ' not recognized'))
  }
}

function org (args, cb) {
  // Entities are in the format <scope>:<org>
  var cmd = args.shift()
  var orgname = args.shift()
  var username = args.shift()
  var role = args.shift()
  return mapToRegistry('/', npm.config, function (err, uri, auth) {
    if (err) { return cb(err) }
    try {
      return npm.registry.org(cmd, uri, {
        auth: auth,
        role: role,
        org: orgname,
        user: username
      }, function (err, data) {
        !err && data && output(JSON.stringify(data, undefined, 2))
        cb(err, data)
      })
    } catch (e) {
      cb(e.message + '\n\nUsage:\n' + org.usage)
    }
  })
}
