// send a tip to a package maintainer

module.exports = tip

var read = require('read')
var iferr = require('iferr')
var npm = require('./npm.js')
var mapToRegistry = require('./utils/map-to-registry.js')
var tokenStore = require('./utils/tokenStore.js')

tip.usage = 'npm tip <pkg> [amount] [account]'

// TODO: something more general and extensible
function getAccountApi (tipAccount) {
  switch (tipAccount) {
    case 'coinbase':
    default:
      return require('./vendor/coinbase.js')
  }
}

function tip (args, cb) {
  if (args.length < 1 || !args[0]) return cb(tip.usage)
  var pkg = args[0]

  var tipAmount
  var tipUnit
  if (args.length < 2) {
    tipAmount = npm.config.get('tip-amount')
    tipUnit = npm.config.get('tip-unit')
  } else {
    var matches = args[1].match(/^(\d+.?\d*)\s?(.*)$/)
    if (!matches || (matches && !matches[1])) {
      return cb(
        'You must specify the amount as a numeric value followed by a unit.'
      )
    }
    tipAmount = matches[1]
    tipUnit = matches[2] ? matches[2] : npm.config.get('tip-unit')
  }

  var tipAccount
  if (args.length < 3) {
    var primaryTipAccount = npm.config.get('primary-tip-account')
    if (!primaryTipAccount) {
      return cb([
        'No default tip account is set.',
        'You must specify an account or set your `primary-tip-account`' +
        ' setting to proceed.'
      ].join('\n'))
    }
    tipAccount = primaryTipAccount
  } else {
    tipAccount = args[2]
  }

  var tipAccountTokens
  try {
    tipAccountTokens = tokenStore.get(tipAccount)
  } catch (e) {
    return cb([
      'You must link a tip account to send tips.',
      'Use `npm link-tip-account` to do this.'
    ].join('\n'))
  }

  mapToRegistry(args[0], npm.config, iferr(cb, function (uri, auth) {
    npm.registry.get(uri, { auth: auth }, iferr(cb, function (config) {
      var latest = config['dist-tags'].latest
      var tipAddress = config.versions[latest].tipAddress
      if (!tipAddress) {
        return cb('No tip address has been specified for this package')
      }
      var accountApi = getAccountApi(tipAccount)
      if (!accountApi) {
        return cb('The account you specified is not supported.')
      }
      if (accountApi.tipUnits.indexOf(tipUnit) === -1) {
        return cb(`The unit ${tipUnit} is not supported by ${tipAccount}`)
      }
      read({
        prompt: `Tip ${pkg} with ${tipAmount} ${tipUnit}? (y/N)`
      }, iferr(cb, function (conf) {
        if ((conf || 'n').toLowerCase() === 'y') {
          try {
            accountApi({
              to: tipAddress,
              amount: tipAmount,
              unit: tipUnit,
              tokens: tipAccountTokens
            }, cb)
          } catch (e) {
            return cb('Unable to send tip. Please check your tipping account.')
          }
        } else {
          return cb()
        }
      }))
    }))
  }))
}
