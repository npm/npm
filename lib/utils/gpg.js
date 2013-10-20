
var child_process = require("child_process")
  , which = require("which")
  , log = require("npmlog")
  , fetch = require("./fetch.js")
  , npm = require("../npm.js")

var gpgExists = null;

function fetchAndVerifySign (url, tmp, cb) {
  var gpg = (npm.config.get && npm.config.get("gpg")) || 'gpg'
    , tmpSign = tmp + '.sign'

  // check if gpg is present in the system,
  // warn if it doesn't (only in the first time)
  if (gpgExists === null) {
    which(gpg, function (err) {
      if (err) {
        log.warn('cannot find gpg',
                 'npm won\'t be able to verify signed packages')
        //       from a very tiny amount of non-lazy maintainers
        //       who actually bothered to sign them
      }

      gpgExists = !err;
      gpgFound(gpgExists)
    })
  } else {
    gpgFound(gpgExists)
  }

  // if gpg is present, fetch .sign file, otherwise just return
  function gpgFound (exists) {
    if (!exists) return cb()

    fetch(url, tmpSign, function (er) {
      if (er) {
        log.error("fetch failed", url)
        return cb(er)
      }

      gpgVerifyFile(tmp, tmpSign, cb)
    })
  }
}

// call gpg and parse its output to check if signature is valid
function gpgVerifyFile (tmp, tmpSign, cb) {
  var args = ['--status-fd', 1, '--verify', tmpSign, tmp]
    , opts = {env: process.env}
    , gpg = (npm.config.get && npm.config.get("gpg")) || 'gpg'

  child_process.execFile(gpg, args, opts, function (er, stdout, stderr) {
    var lines = stdout.split('\n')
      , keywords = {}
      , cb_called = false

    log.silly('gpg args', args)
    log.silly('gpg stdout', stdout)
    log.silly('gpg stderr', stderr)
    log.silly('gpg status', (er && er.code) || 0)

    function checkOutput (key, msg, keyid) {
      if (cb_called) return

      if (keywords[key]) {
        if (msg.indexOf('#') >= 0) {
          // replace '#' with the first argument (a long keyid)
          if (!keyid) keyid = keywords[key].replace(/ .*/, '')
          msg = msg.replace(/#/g, keyid)
        }

        cb_called = true

        // error.code is mainly for tests, but can be useful elsewhere
        var error = new Error('bad signature:\n' + msg)
        error.code = 'GPG_' + key
        cb(error)
      }
    }

    // sometimes gpg returns an error without any output to status fd
    if (!stdout && er) {
      return cb(new Error('gpg error ' + er.code + ':\n' + stderr))
    }

    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^\[GNUPG:\] ([A-Z_]+) (.*)/)
      if (match) keywords[match[1]] = match[2];
    }

    // We're starting from least expected errors to most expected ones
    //
    // It is usually a bad idea, but in this case we want to return
    // a most specific error to a user, and don't take any chance of
    // suspicious gpg output to slip through.

    // specific errors first
    checkOutput('NO_PUBKEY',
      "Public key with keyid # is not available.")

    checkOutput('REVKEYSIG',
      "The signature with the keyid # was revoked.")

    checkOutput('EXPSIG',
      "Public key with the keyid # is expired.")

    checkOutput('EXPKEYSIG',
      "The signature with the keyid # was made by an expired key.")

    // KEYEXPIRED msg doesn't provide keyid, so extract it from BADSIG
    checkOutput('KEYEXPIRED',
      "Public key with the keyid # is expired.",
      (keywords.BADSIG || '').replace(/ .*/, ''))

    // generic errors now
    checkOutput('BADSIG',
      "The signature with the keyid # has not been verified okay.")

    // crc error or something
    checkOutput('NODATA',
      "The signature file is invalid.")

    checkOutput('ERRSIG',
      "The signature with the keyid # cannot be checked.")

    // return if cb() called by checkOutput with an error
    if (cb_called) return;

    if (keywords.GOODSIG && keywords.VALIDSIG && er == null) {
      // requiring presence of both keywords to say that it's valid
      return cb()
    }

    // this should never happen (except for in tests)
    return cb(new Error("gpg - cannot parse output:\n" + stdout))
  })
}

module.exports.fetchAndVerifySign = fetchAndVerifySign
module.exports.gpgVerifyFile = gpgVerifyFile

