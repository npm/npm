module.exports = update

update.usage = 'npm update [pkg]'

var url = require('url')
var util = require('util')
var log = require('npmlog')
var chain = require('slide').chain
var npm = require('./npm.js')
var Installer = require('./install.js').Installer

  // load these, just so that we know that they'll be available, in case
  // npm itself is getting overwritten.
var install = require('./install.js')
var build = require('./build.js')

update.completion = npm.commands.outdated.completion

function update (args, cb) {
  var dryrun = false
  if (npm.config.get('dry-run')) dryrun = true

  npm.commands.outdated(args, true, function (er, rawOutdated) {
    if (er) return cb(er)
    var outdated = rawOutdated.map(function (ww) {
      return {
        dep: ww[0],
        depname: ww[1],
        current: ww[2],
        wanted: ww[3],
        latest: ww[4],
        req: ww[5],
        what: ww[1] + '@' + ww[3]
      }
    })

    var wanted = outdated.filter(function (ww) {
      if (ww.current === ww.wanted && ww.wanted !== ww.latest) {
        log.verbose(
          'outdated',
          'not updating', ww.depname,
          "because it's currently at the maximum version that matches its specified semver range"
        )
      }
      return ww.current !== ww.wanted
    })
    if (wanted.length === 0) return cb()

    log.info('outdated', 'updating', wanted)
    var installers = {}
    wanted.forEach(function (ww) {
      if (ww.current === ww.wanted) return

      // use the initial installation method (repo, tar, git) for updating
      if (url.parse(ww.req).protocol) ww.what = ww.req

      if (installers[ww.where]) {
        installers[ww.where].addPackage(ww.what)
      }
      else {
        installers[ww.where] = new Installer(ww.dep.path, dryrun, [ww.what])
      }
    })
    chain(Object.keys(installers).map(function (where) {
      return [installers[where], 'run']
    }), cb)
  })
}
