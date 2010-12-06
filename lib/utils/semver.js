
// See http://semver.org/
// This implementation is a *hair* less strict in that it allows
// v1.2.3 things, and also tags that don't begin with a char.

var semver = "[v=]*([0-9]+)"                // major
           + "\\.([0-9]+)"                  // minor
           + "\\.([0-9]+)"                  // patch
           + "(-[0-9]+-?)?"                 // build
           + "([a-zA-Z-][a-zA-Z0-9-\.:]*)?" // tag
  , exprComparator = "^((<|>)?=?)("+semver+")$|^$"
  , xRange = "((?:<|>)?=?)([0-9]+|x|X)(?:\\.([0-9]+|x|X)(?:\\.([0-9]+|x|X))?)?"
  , exprSpermy = "(?:~>?)"+xRange
  , expressions = exports.expressions =
    { parse : new RegExp("^\\s*"+semver+"\\s*$")
    , parsePackage : new RegExp("^\\s*([^\/]+)[-@](" +semver+")\\s*$")
    , parseRange : new RegExp(
        "^\\s*(" + semver + ")\\s+-\\s+(" + semver + ")\\s*$")
    , validComparator : new RegExp("^"+exprComparator+"$")
    , parseXRange : new RegExp("^"+xRange+"$")
    , parseSpermy : new RegExp("^"+exprSpermy+"$")
    }
Object.getOwnPropertyNames(expressions).forEach(function (i) {
  exports[i] = function (str) { return (str || "").match(expressions[i]) }
})

exports.rangeReplace = ">=$1 <=$7"
exports.clean = clean
exports.compare = compare
exports.satisfies = satisfies
exports.gt = gt
exports.lt = lt
exports.valid = valid
exports.validPackage = validPackage
exports.validRange = validRange
exports.maxSatisfying = maxSatisfying

function clean (ver) {
  v = exports.parse(ver)
  if (!v) return v
  return [v[1]||'', v[2]||'', v[3]||''].join(".") + (v[4]||'') + (v[5]||'')
}
function valid (version) {
  return exports.parse(version) && version.trim().replace(/^[v=]+/, '')
}
function validPackage (version) {
  return version.match(expressions.parsePackage) && version.trim()
}

// range can be one of:
// "1.0.3 - 2.0.0" range, inclusive, like ">=1.0.3 <=2.0.0"
// ">1.0.2" like 1.0.3 - 9999.9999.9999
// ">=1.0.2" like 1.0.2 - 9999.9999.9999
// "<2.0.0" like 0.0.0 - 1.9999.9999
// ">1.0.2 <2.0.0" like 1.0.3 - 1.9999.9999
var starExpression = /(<|>)?=?\s*\*/g
  , starReplace = ""
  , compTrimExpression = new RegExp("((<|>)?=?)\\s*("+semver+")", "g")
  , compTrimReplace = "$1$3"

function toComparators (range) {
  return range.trim()
    .replace(expressions.parseRange, exports.rangeReplace)
    .split(/\s+/)
      .map(replaceSpermies)
      .map(replaceXRanges)
    .join(" ")
    .replace(compTrimExpression, compTrimReplace)
    .replace(starExpression, starReplace)
    .split("||")
    .map(function (orchunk) {
      return orchunk
        .trim()
        .split(/\s+/)
        .filter(function (c) { return c.match(expressions.validComparator) })
    })
    .filter(function (c) { return c.length })
}

// "2.x","2.x.x" --> ">=2.0.0 <2.1"
// "2.3.x" --> ">=2.3.0 <2.4.0"
function replaceXRanges (ranges) {
  return ranges.split(/\s+/)
               .map(replaceXRange)
               .join(" ")
}
function replaceXRange (version) {
  return version.trim().replace(expressions.parseXRange,
                                function (v, gtlt, M, m, p) {
    var anyX = !M || M.toLowerCase() === "x"
               || !m || m.toLowerCase() === "x"
               || !p || p.toLowerCase() === "x"

    if (gtlt && anyX) throw new Error(
      "Using '"+gtlt+"' with "+[M,m,p].map(function (m) {
        return m ? m : "x"
      }).join(".")
      + " makes no sense. Don't do it.")
    if (!M || M.toLowerCase() === "x") {
      return "*" // allow any
    }
    if (!m || m.toLowerCase() === "x") {
      return ">="+M+".0.0 <"+(+M+1)+".0.0"
    }
    if (!p || p.toLowerCase() === "x") {
      return ">="+M+"."+m+".0 <"+M+"."+(+m+1)+".0"
    }
    return v // impossible?
  })
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceSpermies (version) {
  return version.trim().replace(expressions.parseSpermy,
                                function (v, gtlt, M, m, p) {
    if (gtlt) throw new Error(
      "Using '"+gtlt+"' with ~ makes no sense. Don't do it.")
    if (!M || M.toLowerCase() === "x") {
      return "*"
    }
    if (!m || m.toLowerCase() === "x") {
      return ">="+M+".0.0 <"+(+M+1)+".0.0"
    }
    if (!p || p.toLowerCase() === "x") {
      return ">="+M+"."+m+".0 <"+M+"."+(+m+1)+".0"
    }
    return ">="+M+"."+m+"."+p+" <"+M+"."+(+m+1)+".0"
  })
}

function validRange (range) {
  range = range.trim().replace(starExpression, starReplace)
  var c = toComparators(range)
  return (c.length === 0)
       ? null
       : c.map(function (c) { return c.join(" ") }).join("||")
}

// returns the highest satisfying version in the list, or undefined
function maxSatisfying (versions, range) {
  return versions
    .filter(function (v) { return satisfies(v, range) })
    .sort(compare)
    .pop()
}
function satisfies (version, range) {
  version = valid(version)
  if (!version) return false
  range = toComparators(range)
  for (var i = 0, l = range.length ; i < l ; i ++) {
    var ok = false
    for (var j = 0, ll = range[i].length ; j < ll ; j ++) {
      var r = range[i][j]
        , gtlt = r.charAt(0) === ">" ? gt
               : r.charAt(0) === "<" ? lt
               : false
        , eq = r.charAt(!!gtlt) === "="
        , sub = (!!eq) + (!!gtlt)
      if (!gtlt) eq = true
      r = r.substr(sub)
      r = (r === "") ? r : valid(r)
      ok = (r === "") || (eq && r === version) || (gtlt && gtlt(version, r))
      if (!ok) break
    }
    if (ok) return true
  }
  return false
}

// return v1 > v2 ? 1 : -1
function compare (v1, v2) {
  return v1 === v2 ? 0 : gt(v1, v2) ? 1 : -1
}

function lt (v1, v2) { return gt(v2, v1) }

// return v1 > v2
function num (v) { return parseInt((v||"0").replace(/[^0-9]+/g, ''), 10) }
function gt (v1, v2) {
  v1 = exports.parse(v1)
  v2 = exports.parse(v2)
  if (!v1 || !v2) return false

  for (var i = 1; i < 5; i ++) {
    v1[i] = num(v1[i])
    v2[i] = num(v2[i])
    if (v1[i] > v2[i]) return true
    else if (v1[i] !== v2[i]) return false
  }
  // no tag is > than any tag, or use lexicographical order.
  var tag1 = v1[5] || ""
    , tag2 = v2[5] || ""
  return tag2 && (!tag1 || tag1 > tag2)
}

if (module === require.main) {  // tests below
var assert = require("assert")

; [ ["0.0.0", "0.0.0foo"]
  , ["0.0.1", "0.0.0"]
  , ["1.0.0", "0.9.9"]
  , ["0.10.0", "0.9.0"]
  , ["0.99.0", "0.10.0"]
  , ["2.0.0", "1.2.3"]
  , ["v0.0.0", "0.0.0foo"]
  , ["v0.0.1", "0.0.0"]
  , ["v1.0.0", "0.9.9"]
  , ["v0.10.0", "0.9.0"]
  , ["v0.99.0", "0.10.0"]
  , ["v2.0.0", "1.2.3"]
  , ["0.0.0", "v0.0.0foo"]
  , ["0.0.1", "v0.0.0"]
  , ["1.0.0", "v0.9.9"]
  , ["0.10.0", "v0.9.0"]
  , ["0.99.0", "v0.10.0"]
  , ["2.0.0", "v1.2.3"]
  , ["1.2.3", "1.2.3-asdf"]
  , ["1.2.3-4", "1.2.3"]
  , ["1.2.3-4-foo", "1.2.3"]
  , ["1.2.3-5", "1.2.3-5-foo"]
  , ["1.2.3-5", "1.2.3-4"]
  ].forEach(function (v) {
    assert.ok(gt(v[0], v[1]), "gt('"+v[0]+"', '"+v[1]+"')")
    assert.ok(lt(v[1], v[0]), "lt('"+v[1]+"', '"+v[0]+"')")
    assert.ok(!gt(v[1], v[0]), "!gt('"+v[1]+"', '"+v[0]+"')")
    assert.ok(!lt(v[0], v[1]), "!lt('"+v[0]+"', '"+v[1]+"')")
  })


; [ ["1.0.0 - 2.0.0", "1.2.3"]
  , ["1.0.0", "1.0.0"]
  , [">=*", "0.2.4"]
  , ["", "1.0.0"]
  , ["*", "1.2.3"]
  , ["*", "v1.2.3-foo"]
  , [">=1.0.0", "1.0.0"]
  , [">=1.0.0", "1.0.1"]
  , [">=1.0.0", "1.1.0"]
  , [">1.0.0", "1.0.1"]
  , [">1.0.0", "1.1.0"]
  , ["<=2.0.0", "2.0.0"]
  , ["<=2.0.0", "1.9999.9999"]
  , ["<=2.0.0", "0.2.9"]
  , ["<2.0.0", "1.9999.9999"]
  , ["<2.0.0", "0.2.9"]
  , [">= 1.0.0", "1.0.0"]
  , [">=  1.0.0", "1.0.1"]
  , [">=   1.0.0", "1.1.0"]
  , ["> 1.0.0", "1.0.1"]
  , [">  1.0.0", "1.1.0"]
  , ["<=   2.0.0", "2.0.0"]
  , ["<= 2.0.0", "1.9999.9999"]
  , ["<=  2.0.0", "0.2.9"]
  , ["<    2.0.0", "1.9999.9999"]
  , ["<\t2.0.0", "0.2.9"]
  , [">=0.1.97", "v0.1.97"]
  , [">=0.1.97", "0.1.97"]
  , ["0.1.20 || 1.2.4", "1.2.4"]
  , [">=0.2.3 || <0.0.1", "0.0.0"]
  , [">=0.2.3 || <0.0.1", "0.2.3"]
  , [">=0.2.3 || <0.0.1", "0.2.4"]
  , ["||", "1.3.4"]
  , ["2.x.x", "2.1.3"]
  , ["1.2.x", "1.2.3"]
  , ["1.2.x || 2.x", "2.1.3"]
  , ["1.2.x || 2.x", "1.2.3"]
  , ["x", "1.2.3"]
  , ["2", "2.1.2"]
  , ["2.3", "2.3.1"]
  , ["~2.4", "2.4.0"] // >=2.4.0 <2.5.0
  , ["~2.4", "2.4.5"]
  , ["~>3.2.1", "3.2.2"] // >=3.2.1 <3.3.0
  , ["~1", "1.2.3"] // >=1.0.0 <2.0.0
  , ["~>1", "1.2.3"]
  , ["~1.0", "1.0.2"] // >=1.0.0 <1.1.0
  ].forEach(function (v) {
    assert.ok(satisfies(v[1], v[0]), v[0]+" satisfied by "+v[1])
  })


// negative tests
; [ ["1.0.0 - 2.0.0", "2.2.3"]
  , ["1.0.0", "1.0.1"]
  , [">=1.0.0", "0.0.0"]
  , [">=1.0.0", "0.0.1"]
  , [">=1.0.0", "0.1.0"]
  , [">1.0.0", "0.0.1"]
  , [">1.0.0", "0.1.0"]
  , ["<=2.0.0", "3.0.0"]
  , ["<=2.0.0", "2.9999.9999"]
  , ["<=2.0.0", "2.2.9"]
  , ["<2.0.0", "2.9999.9999"]
  , ["<2.0.0", "2.2.9"]
  , [">=0.1.97", "v0.1.93"]
  , [">=0.1.97", "0.1.93"]
  , ["0.1.20 || 1.2.4", "1.2.3"]
  , [">=0.2.3 || <0.0.1", "0.0.3"]
  , [">=0.2.3 || <0.0.1", "0.2.2"]
  , ["2.x.x", "1.1.3"]
  , ["2.x.x", "3.1.3"]
  , ["1.2.x", "1.3.3"]
  , ["1.2.x || 2.x", "3.1.3"]
  , ["1.2.x || 2.x", "1.1.3"]
  , ["2", "1.1.2"]
  , ["2.3", "2.4.1"]
  , ["~2.4", "2.5.0"] // >=2.4.0 <2.5.0
  , ["~2.4", "2.3.9"]
  , ["~>3.2.1", "3.3.2"] // >=3.2.1 <3.3.0
  , ["~>3.2.1", "3.2.0"] // >=3.2.1 <3.3.0
  , ["~1", "0.2.3"] // >=1.0.0 <2.0.0
  , ["~>1", "2.2.3"]
  , ["~1.0", "1.1.0"] // >=1.0.0 <1.1.0
  ].forEach(function (v) {
    assert.ok(!satisfies(v[1], v[0]), v[0]+" not satisfied by "+v[1])
  })

}
