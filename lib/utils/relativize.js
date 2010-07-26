
module.exports = relativize

// return the shortest path between two folders.
function relativize (dest, src) {
  // both of these are absolute paths.
  // find the shortest relative distance.
  src = src.split("/")
  var abs = dest
  dest = dest.split("/")
  var i = 0
  while (src[i] === dest[i]) i++
  if (i === 1) return abs // nothing in common, leave absolute
  src.splice(0, i + 1)
  var dots = [0, i, "."]
  for (var i = 0, l = src.length; i < l; i ++) dots.push("..")
  dest.splice.apply(dest, dots)
  dest = dest.join("/")
  return abs.length < dest.length ? abs : dest
}
