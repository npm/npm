'use strict'

let callbacks = ['done', 'cb', 'callback', 'next']

module.exports = function isNamedCallback(potentialCallbackName, exceptions) {
  for (let i = 0; i < exceptions.length; i++) {
    callbacks = callbacks.filter(function(item) {
      return item !== exceptions[i]
    })
  }
  return callbacks.some(function(trueCallbackName) {
    return potentialCallbackName === trueCallbackName
  })
}
