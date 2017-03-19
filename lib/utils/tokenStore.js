// utility to get and set bitcoin account secrets

var keytar = require('keytar')

var SERVICE = 'npmTokenStore'

function set (type, tokens) {
  var existing = keytar.getPassword(SERVICE, type)

  // tokens are stored internally as a JSON object with numeric keys
  var tokensToAdd = ''
  if (typeof tokens === 'object') {
    var tokensObj = {}
    Object.keys(tokens).forEach(function (key, i) {
      tokensObj[i] = tokens[key]
    })
    tokensToAdd = JSON.stringify(tokensObj)
  }
  if (Array.isArray(tokens)) {
    var tokensObj = {}
    tokens.forEach(function (t, i) {
      tokensObj[i] = t
    })
    tokensToAdd = JSON.stringify(tokensObj)
  }
  if (typeof tokens === 'string') tokensToAdd = tokens

  // add to OS-specific keystore
  if (existing) {
    if (!keytar.replacePassword(SERVICE, type, tokensToAdd)) {
      throw new Error('Could not replace existing tokens.')
    }
  } else {
    if (!keytar.addPassword(SERVICE, type, tokensToAdd)) {
      throw new Error('Could not add new tokens.')
    }
  }
}

function get (type) {
  var existing = keytar.getPassword(SERVICE, type)
  if (!existing) {
    throw new Error('Could not retrieve tokens')
  }
  return existing
}

exports.set = set
exports.get = get
