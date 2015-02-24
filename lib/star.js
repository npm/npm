module.exports = star

var npm = require('./npm.js')
var log = require('npmlog')
var asyncMap = require('slide').asyncMap
var mapToRegistry = require('./utils/map-to-registry.js')

star.usage = 'npm star <package> [pkg, pkg, ...]\n'
           + 'npm unstar <package> [pkg, pkg, ...]'

star.completion = function (opts, cb) {
  mapToRegistry('-/short', npm.config, function (er, uri, auth) {
    if (er) return cb(er)

    var params = {
      timeout : 60000,
      auth    : auth
    }
    npm.registry.get(uri, params, function (er, list) {
      return cb(null, list || [])
    })
  })
}

function star (args, cb) {
  if (!args.length) return cb(star.usage)
  var s = npm.config.get('unicode') ? '\u2605 ' : '(*)'
  var u = npm.config.get('unicode') ? '\u2606 ' : '( )'
  var using = !(npm.command.match(/^un/))
  if (!using) s = u
  asyncMap(args, function (pkg, cb) {
    mapToRegistry(pkg, npm.config, function (er, uri, auth) {
      if (er) return cb(er)

      var params = {
        starred : using,
        auth    : auth
      }
      npm.registry.star(uri, params, function (er, data, raw, req) {
        if (!er) {
          console.log(s + ' '+pkg)
          log.verbose('star', data)
        }
        cb(er, data, raw, req)
      })
    })
  }, cb)
}
