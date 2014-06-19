module.exports = isScoped

function isScoped(spec) {
  if (spec.charAt(0) !== "@") return false

  var rest = spec.slice(1).split("/")
  if (rest.length !== 2) return false

  return rest[0] && rest[1] &&
    rest[0] === encodeURIComponent(rest[0]) &&
    rest[1] === encodeURIComponent(rest[1])
}
