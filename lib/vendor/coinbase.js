// wrapper for Coinbase API

module.exports = sendTip

var Client = require('coinbase').Client
var iferr = require('iferr')
var output = require('../utils/output.js')

sendTip.tipUnits = ['BTC', 'mBTC', 'uBTC']

function sendTip ({tokens: jsonTokens, to, amount, unit}, cb) {
  var tokens
  try {
    tokens = JSON.parse(jsonTokens)
  } catch (e) {
    return cb(
      'Invalid tokens specified for Coinbase. Please include the `apiKey` and ' +
      'the `apiSecret`.'
    )
  }

  var client = new Client({
    apiKey: tokens[0],
    apiSecret: tokens[1]
  })

  client.getAccount('primary', iferr(cb, function (account) {
    account.sendMoney({
      to,
      amount,
      currency: unit,
      description: 'Sent using `npm tip`'
    }, iferr(cb, function (tx) {
      output(tx.id ? 'Sent tip successfully!'
        : 'Tip sending incomplete. Please check your Coinbase account.')
      cb()
    }))
  }))
}
