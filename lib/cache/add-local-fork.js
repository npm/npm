var log = require('npmlog')
var iferr = require('iferr')

process.once('message', function onMessage (message) {
  var tgz = message.tgz
  var p = message.p

  var npm = require('../npm.js')
  var buildConf = require('../utils/build-conf.js')
  npm.load(buildConf(), iferr(cb, thenInstall))

  function thenInstall () {
    var install = require('../install.js')
    install([], iferr(cb, thenPrune))
  }

  function thenPrune () {
    var prune = require('../prune.js')
    prune([], iferr(cb, thenPack))
  }

  function thenPack () {
    var tar = require('../utils/tar.js')
    tar.pack(tgz, p, undefined, function (er) {
      if (er) {
        log.error('addLocalDirectory', 'Could not pack', p, 'to', tgz)
      }
      cb(er)
    })
  }

  function cb (er) {
    var error = undefined
    if (er instanceof Error && er.stack) {
      error = er.stack + '\n From fork child, ' +
        String(er.message).replace(/\n/g, '\n ')
    } else if (er) {
      error = String(er)
    }
    process.send({
      error: error
    })
    setTimeout(function () {
      process.exit(0)
    })
  }
})
