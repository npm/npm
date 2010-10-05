var sys = require('sys')

exports.parse = function parse (d) {
  var ini = {'-':{}}
    , section = '-'
    , lines = d.split('\n')
  for (var i = 0, l = lines.length; i < l; i++ ) {
    var line = lines[i].trim()
      , rem = line.indexOf(";")
    if (rem !== -1) line = line.substr(0, rem)
    var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
      , match = line.match(re)
    if (match) {
      if (match[1] !== undefined) {
        section = match[1].trim()
        ini[section] = {}
      } else {
        var key = match[2].trim()
          , value = (match[3]) ? (match[4] || "").trim() : true
        ini[section][key] = value
      }
    }
  }

  return ini
}

function safe (val) { return (val+"").replace(/[\n\r]+/g, " ") }

// ForEaches over an object. The only thing faster is to inline this function.
function objectEach(obj, fn, thisObj) {
  var keys = Object.keys(obj).sort(function (a,b) {
    a = a.toLowerCase()
    b = b.toLowerCase()
    return a === b ? 0 : a < b ? -1 : 1
  })
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i]
    fn.call(thisObj, obj[key], key, obj)
  }
}

exports.stringify = function stringify (obj) {
  // if the obj has a "-" section, then do that first.
  var ini = []
  if ("-" in obj) {
    objectEach(obj["-"], function (value, key) {
      ini[ini.length] = safe(key) + " = " + safe(value) + "\n"
    })
  }
  objectEach(obj, function (section, name) {
    if (name === "-") return undefined
    ini[ini.length] = "[" + safe(name) + "]\n"
    objectEach(section, function (value, key) {
      ini[ini.length] = safe(key) + ((value === true)
        ? "\n"
        : " = "+safe(value)+"\n")
    })
  })
  return ini.join("")
}

exports.encode = exports.stringify
exports.decode = exports.parse
