
module.exports = getCompletions

var npm = require("../../../npm")

// Returns all completions of str within list.
// NOTE: isCmd predicates whether or not to deref str.
function getCompletions (str, list, isCmd) {
  var result = []
  list.forEach(function (f) {
    var a = isCmd ? npm.deref(f) : f
    if (result.indexOf(a) === -1 && f.indexOf(str) === 0) {
      result.push(a)
    }
  })
  return result
}
