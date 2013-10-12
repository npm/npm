var test = require("tap").test
var verify = require("../../lib/utils/gpg").gpgVerifyFile
var child_process = require("child_process")
var _orig_exec = child_process.execFile

// A bunch of tests that override exec('gpg, ...) and check
// that GPG output is parsed correctly

function addTest (name, gpgOutput, gpgExitCode, cb) {
  if (!cb) {
    // gpgExitCode is optional, defaults to 0
    cb = gpgExitCode
    gpgExitCode = 0
  }

  test(name, function(t) {
    child_process.execFile = function(file, args, opts, cb) {
      if (gpgExitCode) {
        cb({code: gpgExitCode}, gpgOutput, 'gpg_stderr_input')
      } else {
        cb(null, gpgOutput, 'gpg_stderr_output')
      }
    }
    verify("xxxxx", "yyyyy", function(err) {
      child_process.execFile = _orig_exec
      cb(t, err)
    })
  })
}

test("setup", function(t) {
  t.end()
})

test("calling", function(t) {
  child_process.execFile = function(file, args, opts, cb) {
    // both files should be arguments, so sign will be processed
    // as a detached one
    t.ok(args.indexOf("xxxxx") >= 0)
    t.ok(args.indexOf("yyyyy") >= 0)

    // these arguments should be present, it's weird if they don't
    t.ok(args.indexOf("--status-fd") >= 0)
    t.ok(args.indexOf("--verify") >= 0)

    child_process.execFile = _orig_exec
    t.end()
  }
  verify("xxxxx", "yyyyy", function() {});
})

var goodsig =
  [ '[GNUPG:] SIG_ID 7yxv7UktU03mdVZGkBeftUfwNAE 2013-10-12 1381555456'
  , '[GNUPG:] GOODSIG 98F4DE4B2D201C0A John Doe <test@example.com>'
  , '[GNUPG:] VALIDSIG 37FCF987495045D2759C8FA898F4DE4B2D201C0A 2013-10-12 1381555456 0 4 0 1 2 00 37FCF987495045D2759C8FA898F4DE4B2D201C0A'
  , '[GNUPG:] TRUST_ULTIMATE'
  , ''
  ].join("\n")

var badsig = '[GNUPG:] BADSIG 98F4DE4B2D201C0A John Doe <test@example.com>\n'

var expiredsig = 
  [ '[GNUPG:] KEYEXPIRED 1169711867'
  , '[GNUPG:] SIGEXPIRED deprecated-use-keyexpired-instead'
  , '[GNUPG:] SIG_ID PqEHxvlYlEeX4yfEeOKZ65t96Tg 2010-03-05 1267754932'
  , '[GNUPG:] KEYEXPIRED 1169711867'
  , '[GNUPG:] SIGEXPIRED deprecated-use-keyexpired-instead'
  , '[GNUPG:] EXPKEYSIG 98F4DE4B2D201C0A John Doe <test@example.com>'
  , '[GNUPG:] KEYEXPIRED 1343379765'
  , '[GNUPG:] SIGEXPIRED deprecated-use-keyexpired-instead'
  , '[GNUPG:] VALIDSIG 8C369BDFA2B66CF61DB6E69DC15901320D9B5665 2010-03-05 1267754932 0 4 0 1 2 01 8C369BDFA2B66CF61DB6E69DC15901320D9B5665'
  , ''
  ].join("\n")

var unknownsig =
  [ '[GNUPG:] ERRSIG 98F4DE4B2D201C0A 1 2 00 1381093580 9'
  , '[GNUPG:] NO_PUBKEY 98F4DE4B2D201C0A'
  , ''
  ].join("\n")

var badfile =
  [ '[GNUPG:] NODATA 1'
  , '[GNUPG:] NODATA 2'
  , ''
  ].join("\n")

addTest('good signature', goodsig, function(t, err) {
  t.ok(!err)
  t.end()
})

// shouldn't return success on non-zero status code, ever
addTest('bad exit code', '', 1, function(t, err) {
  t.ok(err.message.match(/gpg_stderr_input/))
  t.end()
})

addTest('bad exit code 2', goodsig, 1, function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

// routine checks
addTest('bad sig', badsig, function(t, err) {
  t.equal(err.code, 'GPG_BADSIG')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

addTest('expired sig', expiredsig, function(t, err) {
  t.equal(err.code, 'GPG_EXPKEYSIG')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

addTest('corrupted sig', badfile, function(t, err) {
  t.equal(err.code, 'GPG_NODATA')
  t.end()
})

addTest('unknown sig', unknownsig, function(t, err) {
  t.equal(err.code, 'GPG_NO_PUBKEY')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

// if there any suspicious output, fail
addTest('joined sigs', goodsig+badsig, function(t, err) {
  t.equal(err.code, 'GPG_BADSIG')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

addTest('joined sigs 2', badsig+goodsig, function(t, err) {
  t.equal(err.code, 'GPG_BADSIG')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

addTest('joined sigs 3', goodsig+expiredsig, function(t, err) {
  t.equal(err.code, 'GPG_EXPKEYSIG')
  t.ok(err.message.match(/98F4DE4B2D201C0A/))
  t.end()
})

// we're waiting for both validsig and goodsig
addTest('no goodsig', goodsig.replace(/GOOD/, 'G00D'), function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

addTest('no validsig', goodsig.replace(/VALID/, 'VAL1D'), function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

// various garbage output
addTest('garbage 1', goodsig.replace(/GNUPG/g, 'GPUNG'), function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

addTest('garbage 2', goodsig.replace(/ /g, '  '), function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

addTest('garbage 3', goodsig.replace(/\n/g, '\n '), function(t, err) {
  t.ok(err.message.match(/cannot parse output/))
  t.end()
})

test("shutdown", function(t) {
  child_process.execFile = _orig_exec
  t.end()
})
