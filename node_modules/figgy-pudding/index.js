'use strict'

class FiggyPudding {
  constructor (specs, opts, providers) {
    this.specs = specs || {}
    this.opts = opts || (() => false)
    this.providers = reverse((providers || []).filter(
      x => x != null && typeof x === 'object'
    ))
    this.isFiggyPudding = true
  }
  get (key) {
    return pudGet(this, key, true)
  }
  concat (...moreConfig) {
    return new FiggyPudding(
      this.specs,
      this.opts,
      reverse(this.providers).concat(moreConfig)
    )
  }
}

function pudGet (pud, key, validate) {
  let spec = pud.specs[key]
  if (typeof spec === 'string') {
    key = spec
    spec = pud.specs[key]
  }
  if (validate && !spec && (!pud.opts.other || !pud.opts.other(key))) {
    throw new Error(`invalid config key requested: ${key}`)
  } else {
    if (!spec) { spec = {} }
    let ret
    for (let p of pud.providers) {
      if (p.isFiggyPudding) {
        ret = pudGet(p, key, false)
      } else if (typeof p.get === 'function') {
        ret = p.get(key)
      } else {
        ret = p[key]
      }
      if (ret !== undefined) {
        break
      }
    }
    if (ret === undefined && spec.default !== undefined) {
      if (typeof spec.default === 'function') {
        return spec.default()
      } else {
        return spec.default
      }
    } else {
      return ret
    }
  }
}

module.exports = figgyPudding
function figgyPudding (specs, opts) {
  function factory (...providers) {
    return new FiggyPudding(
      specs,
      opts,
      providers
    )
  }
  return factory
}

function reverse (arr) {
  const ret = []
  arr.forEach(x => ret.unshift(x))
  return ret
}
