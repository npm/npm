'use strict'

module.exports = (obj, proto, bound) => {
  bound = bound || Object.create(null)

  if (Array.isArray(bound))
    bound = bound.reduce((s, k) => (s[k] = true, s), Object.create(null))

  // don't try to bind constructors, it's weird
  bound.constructor = true
  proto = proto || obj

  Object.keys(proto)
    .filter(k => (typeof obj[k] === 'function' && !bound[k]))
    .forEach(k => (bound[k] = true, obj[k] = proto[k].bind(obj)))

  Object.getOwnPropertyNames(proto)
    .filter(k => (typeof obj[k] === 'function' && !bound[k]))
    .forEach(k => (bound[k] = true, Object.defineProperty(obj, k, {
      value: obj[k].bind(obj),
      enumerable: false,
      configurable: true,
      writable: true
    })))
}
