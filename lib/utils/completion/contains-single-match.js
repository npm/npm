
module.exports = containsSingleMatch

// True if arr contains only one element starting with str.
function containsSingleMatch(str, arr) {
  var filtered = arr.filter(function(e) { return e.indexOf(str) === 0 })
  return filtered.length === 1
}