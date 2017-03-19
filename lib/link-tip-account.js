// link your bitcoin account to send tips

module.exports = linkTipAccount

var npm = require('./npm.js')
var tokenStore = require('./utils/tokenStore.js')

linkTipAccount.usage =
  'npm link-tip-account <type> <token> [secretToken ...]'

function linkTipAccount (args, cb) {
  if (args.length < 1) return cb(linkTipAccount.usage)

  try {
    tokenStore.set(args[0], args.splice(1, args.length - 1))
  } catch (e) {
    return cb(e)
  }

  // if no default tip account is specified, use this one by default
  if (!npm.config.get('primary-tip-account')) {
    npm.config.set('primary-tip-account', args[1])
  }

  cb()
}
