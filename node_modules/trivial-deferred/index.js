module.exports = Deferred

var P
/* istanbul ignore next */
try {
  P = Promise
} catch (er) {
  try {
    P = require('bluebird')
  } catch (er) {
    throw new Error('this module requires a Promise implementation.  ' +
                    'Try installing bluebird.')
  }
}


function Deferred () {
  this.resolve = null
  this.reject = null
  this.promise = new P(function (resolve, reject) {
    this.reject = reject
    this.resolve = resolve
  }.bind(this))
}
