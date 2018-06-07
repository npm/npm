'use strict'

module.exports = shallow
shallow.strict = strict

// TODO a future version of this that drops node 0.x support will
// check for Symbol.iterator, and handle anything that can be passed
// to Array.from()

var hasSet = typeof Set === 'function'

function isSet (object) {
  return hasSet && (object instanceof Set)
}

function isMap (object) {
  return hasSet && (object instanceof Map)
}

function setSame (a, b, ca, cb, fn) {
  if (a.size !== b.size)
    return false
  else if (a.size === 0)
    return true
  else {
    var ret = true
    var seen = new Set()
    a.forEach(function (entry) {
      if (!ret)
        return

      if (b.has(entry) && !seen.has(entry)) {
        seen.add(entry)
        return
      }

      // see if b has anything that matches
      // but don't allow anything to match more than once.
      var done = false
      b.forEach(function (bentry) {
        if (done || seen.has(bentry))
          return

        if (fn(bentry, entry, ca, cb)) {
          seen.add(bentry)
          ret = true
          done = true
        }
      })

      // didn't find the match by walking the object
      // not a match!
      if (!done)
        ret = false
    })
    return ret
  }
}

function mapSame (a, b, ca, cb, fn) {
  var ret = a.size === b.size
  if (a.size && ret) {
    a.forEach(function (value, key) {
      if (ret)
        ret = b.has(key)
      if (ret)
        ret = fn(value, b.get(key), ca, cb)
    })
  }
  return ret
}

function isArguments (object) {
  return Object.prototype.toString.call(object) === '[object Arguments]'
}

function arrayFrom (obj) {
  return Array.isArray(obj) ? obj
    : Array.from ? Array.from(obj)
    : Array.prototype.slice.call(obj)
}

function strict (a, b) {
  return deeper(a, b, [], [])
}

function deeper (a, b, ca, cb) {
  return a === b ? true
    : a !== a ? b !== b
    : typeof a !== 'object' || typeof b !== 'object' ? false
    : a === null || b === null ? false
    : Buffer.isBuffer(a) && Buffer.isBuffer(b) ? bufferSame(a, b)
    : a instanceof Date && b instanceof Date ? a.getTime() === b.getTime()
    : a instanceof RegExp && b instanceof RegExp ? regexpSame(a, b)
    : isArguments(a) ?
      isArguments(b) && deeper(arrayFrom(a), arrayFrom(b), ca, cb)
    : isArguments(b) ? false
    : a.constructor !== b.constructor ? false
    : isSet(a) && isSet(b) ? setSame(a, b, ca, cb, deeper)
    : isMap(a) && isMap(b) ? mapSame(a, b, ca, cb, deeper)
    : deeperObj(a, b, Object.keys(a), Object.keys(b), ca, cb)
}

function deeperObj (a, b, ka, kb, ca, cb) {
  // don't bother with stack acrobatics if there's nothing there
  return ka.length === 0 && kb.length === 0 ? true
    : ka.length !== kb.length ? false
    : deeperObj_(a, b, ka, kb, ca, cb)
}

function deeperObj_ (a, b, ka, kb, ca, cb) {
  var ret = true

  var cal = ca.length

  var go = true
  while (cal-- && go) {
    if (ca[cal] === a) {
      ret = cb[cal] === b
      go = false
    }
  }

  if (go) {
    ca.push(a)
    cb.push(b)

    ka.sort()
    kb.sort()

    for (var j = ka.length - 1; j >= 0 && ret; j--) {
      if (ka[j] !== kb[j])
        ret = false
    }

    if (ret) {
      var key
      for (var k = ka.length - 1; k >= 0 && ret; k--) {
        key = ka[k]
        if (!deeper(a[key], b[key], ca, cb))
          ret = false
      }
    }

    if (ret) {
      ca.pop()
      cb.pop()
    }
  }

  return ret
}

function shallow (a, b) {
  return shallower(a, b, [], [])
}

function regexpSame (a, b) {
  return a.source === b.source &&
    a.global === b.global &&
    a.multiline === b.multiline &&
    a.lastIndex === b.lastIndex &&
    a.ignoreCase === b.ignoreCase
}

function bufferSame (a, b) {
  var ret
  if (a.equals) {
    ret = a.equals(b)
  } else if (a.length !== b.length) {
    ret = false
  } else {
    ret = true
    for (var j = 0; j < a.length && ret; j++) {
      if (a[j] != b[j])
        ret = false
    }
  }
  return ret
}

function shallower (a, b, ca, cb) {
  return typeof a !== 'object' && typeof b !== 'object' && a == b ? true
    : a === null || b === null ? a == b
    : a !== a ? b !== b
    : typeof a !== 'object' || typeof b !== 'object' ? false
    : Buffer.isBuffer(a) && Buffer.isBuffer(b) ? bufferSame(a, b)
    : a instanceof Date && b instanceof Date ? a.getTime() === b.getTime()
    : a instanceof RegExp && b instanceof RegExp ? regexpSame(a, b)
    : isArguments(a) || isArguments(b) ?
      shallower(arrayFrom(a), arrayFrom(b), ca, cb)
    : isSet(a) && isSet(b) ? setSame(a, b, ca, cb, shallower)
    : isMap(a) && isMap(b) ? mapSame(a, b, ca, cb, shallower)
    : shallowerObj(a, b, Object.keys(a), Object.keys(b), ca, cb)
}

function shallowerObj (a, b, ka, kb, ca, cb) {
  // don't bother with stack acrobatics if there's nothing there
  return ka.length === 0 && kb.length === 0 ? true
    : ka.length !== kb.length ? false
    : shallowerObj_(a, b, ka, kb, ca, cb)
}

function shallowerObj_ (a, b, ka, kb, ca, cb) {
  var ret

  var cal = ca.length
  var go = true
  while (cal-- && go) {
    if (ca[cal] === a) {
      ret = cb[cal] === b
      go = false
    }
  }

  if (go) {
    ca.push(a)
    cb.push(b)

    ka.sort()
    kb.sort()

    ret = true
    for (var k = ka.length - 1; k >= 0 && ret; k--) {
      if (ka[k] !== kb[k])
        ret = false
    }

    if (ret) {
      var key
      for (var l = ka.length - 1; l >= 0 && ret; l--) {
        key = ka[l]
        if (!shallower(a[key], b[key], ca, cb))
          ret = false
      }
    }

    if (ret) {
      ca.pop()
      cb.pop()
    }
  }

  return ret
}
