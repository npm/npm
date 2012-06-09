module.exports = report

var request = require('request')
  , url = process.env.NPATURL || 'http://npat.iriscouch.com/results/'

// reports test results to couchCB. additional information about the node
// version and operating system is added before reporting.
// `results` should contain the following properties:
// { version: version of the package being tested
// , stdout: stdout from the test cases that were run
// , stderr: stderr from test cases
// , error: error if necessary
// , code: code exit code from the test's process
// }

function report(results, cb) {
  if (!results.name) cb && cb(new Error('report: No `name` property given'))
  var data =
  // from caller
  { stdout: results.stdout || ''
  , stderr: results.stderr || ''
  , code: results.code
  , error: results.error || ''
  , version: results.version
  , name: results.name || ''

  // from environent
  , node: process.version
  , arch: process.arch
  , platform: process.platform
  }

  var rand = uuid()
  var uri = 'http://npat.iriscouch.com/results/' + rand;
  var options = {
    uri: uri
  , json: data
  }
  request.put(options, function (error, response, body) {
    if (response.statusCode == 201) {
      console.log('   Test results saved at', uri, ' Thank you for participating :)')
    } else {
      console.log('   error: '+ response.statusCode)
      console.log(body)
    }
  })
}

// via https://gist.github.com/982883, by
function uuid(
  a                  // placeholder
){
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a/4         // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        uuid         // random hex digits
      )
}

// This works just fine
if (require.main === module) {
  report({ name: 'gss', stderr: 'sent via report.js ifmain' })
}
