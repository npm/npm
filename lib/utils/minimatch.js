// This is a JavaScript implementation of the fnmatch-like
// stuff that git uses in its .gitignore files.
// See `man 5 gitignore`.

module.exports = minimatch

var re = {}
  , path = require("path")

function minimatch (p, pattern) {
  if (!pattern) return false
  if (pattern.trim().charAt(0) === "#") return false
  if (!re[pattern]) re[pattern] = makeRe(pattern)
  // patterns that end in / can only match dirs
  // however, dirs also match the same thing that *doesn't*
  // end in a slash.
  //
  // a pattern with *no* slashes will match against either the full
  // path, or just the basename.
  var match = !!p.match(re[pattern])
      || ( p.substr(-1) === "/"
         && !!p.slice(0, -1).match(re[pattern]) )
      || (pattern.indexOf("/") === -1 && path.basename(p).match(re[pattern]))

  //console.error("  MINIMATCH: %j %j %j %j",
  //            re[pattern].toString(), pattern, p, match)
  return match
}

function makeRe (pattern) {
  var braceDepth = 0
    , re = ""
    , escaping = false
    , oneStar = "[^\\/]*?"
    , twoStar = ".*?"
    , reSpecials = "().*{}+?[]^$/\\"
    , patternListStack = []
    , stateChar
    , negate = false
    , negating = false

  for ( var i = 0, len = pattern.length, c
      ; (i < len) && (c = pattern.charAt(i))
      ; i ++ ) {

    switch (c) {
      case "\\":
        if (escaping) {
          re += "\\\\" // must match literal \
          escaping = false
        } else {
          escaping = true
        }
        continue

      case "!":
        if (i === 0 || negating) {
          negate = !negate
          negating = true
          break
        }
        // fallthrough
      case "+":
      case "@":
      case "*":
      case "?":
        negating = false
        if (escaping) {
          re += "\\" + c
          escaping = false
        } else {
          if (c === "*" && stateChar === "*") { // **
            re += twoStar
            stateChar = false
          } else {
            stateChar = c
          }
        }
        continue

      case "(":
        if (escaping) {
          re += "\\("
          escaping = false
        } else if (stateChar) {
          plType = stateChar
          patternListStack.push(plType)
          re += stateChar === "!" ? "(?!" : "(:?"
          stateChar = false
        } else {
          re += "\\("
        }
        continue

      case ")":
        if (escaping) {
          re += "\\)"
          escaping = false
        } else if (patternListStack.length) {
          re += ")"
          plType = patternListStack.pop()
          switch (plType) {
            case "?":
            case "+":
            case "*": re += plType
            case "!":
            case "@": break
          }
        } else {
          re += "\\)"
        }
        continue

      case "|":
        if (escaping) {
          re += "\\|"
          escaping = false
        } else if (patternListStack.length) {
          re += "|"
        } else {
          re += "\\|"
        }
        continue

      // turns out these are the same in regexp and glob :)
      case "]":
      case "[":
        if (escaping) {
          re += "\\" + c
          escaping = false
        } else {
          re += c
        }
        continue

      case "{":
        if (escaping) {
          re += "\\{"
          escaping = false
        } else {
          re += "(:?"
          braceDepth ++
        }
        continue

      case "}":
        if (escaping || braceDepth === 0) {
          re += "\\}"
          escaping = false
        } else {
          re += ")"
          braceDepth --
        }
        continue

      case ",":
        if (escaping || braceDepth === 0) {
          re += ","
          escaping = false
        } else {
          re += "|"
        }
        continue

      default:
        if (stateChar) {
          // we had some state-tracking character
          // that wasn't consumed by this pass.
          switch (stateChar) {
            case "*":
              re += oneStar
              break
            case "?":
              re += "."
              break
            default:
              re += "\\"+stateChar
              break
          }
          stateChar = false
        }
        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials.indexOf(c) !== -1) {
          re += "\\"
        }
        re += c
    } // switch

    if (negating && c !== "!") negating = false

  } // for

  // handle trailing things that only matter at the very end.
  if (stateChar) {
    // we had some state-tracking character
    // that wasn't consumed by this pass.
    switch (stateChar) {
      case "*":
        re += oneStar
        break
      case "?":
        re += "."
        break
      default:
        re += "\\"+stateChar
        break
    }
    stateChar = false
  } else if (escaping) {
    re += "\\\\"
  }

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = "^" + re + "$"

  // fail on the pattern, but allow anything otherwise.
  if (negate) re = "^(!?" + re + ").*$"

  return new RegExp(re)
}

if (require.main === module) {
  var tests = ["{a,b{c,d}}"
              ,"a.*$?"
              ,"\\{a,b{c,d}}"
              ,"a/{c/,}d/{e/,f/{g,h,i}/}k"
              ,"!*.bak"
              ,"!!*.bak"
              ,"!!!*.bak"
              ,"\\a\\b\\c\\d"
              ]
  tests.forEach(function (t) {
    console.log([t,makeRe(t)])
  })
}


